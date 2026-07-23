-- Corrige training_slots: varios turnos agrupaban 2-4 tiras a la vez bajo un único
-- profe_titular_id, pero cada tira tiene su propio plantel de profes (planilla fuente
-- "Profesores x tiras"). Esto generaba turnos con profe/categoría que no correspondían
-- (caso detectado: Matías Villegas cargado como titular de Liga Ramos 2017-2018 cuando
-- está habilitado para Metro 2010-2012).
--
-- Estrategia: por cada turno activo (al momento de correr esta migración), separar en
-- una fila por tira, y dentro de cada tira separar por el grupo Juveniles/Infantiles de
-- la planilla (algunos turnos agrupaban categorías que cruzan ese límite bajo un solo
-- profe). El profe titular y los suplentes de cada fila nueva salen 1:1 de la planilla,
-- no de lo que había cargado antes. Los turnos originales se desactivan
-- (is_active = false) en vez de borrarse, para no romper referencias históricas
-- (asistencia de profes, etc).
--
-- Categoría/tira sin ningún profe en la planilla (ej. edefi 2014-2017, liga2 2017-2018,
-- liga1 2018-2019) se descarta silenciosamente de los turnos nuevos: no existe nadie a
-- quien asignarle esa clase según la fuente de verdad, así que no se inventa un profe.
--
-- "2019" no existe en la planilla (categoría nueva del club, agregada después) — se
-- asume que sigue al mismo grupo que "2018" (Metro Infantiles: Pablo Simone / Mauro
-- Salotti / Ramiro Carrillo), a confirmar con el club.

begin;

create temp table orig_slots_before on commit drop as
  select id from training_slots where is_active = true;

with groups(tira, cat_name, titular_name, suplente_names) as (
  values
    ('metro','2010', 'Emmanuel Muñoz', array['Matías Villegas']),
    ('metro','2011', 'Emmanuel Muñoz', array['Matías Villegas']),
    ('metro','2012', 'Emmanuel Muñoz', array['Matías Villegas']),
    ('metro','2013', 'Pablo Simone', array['Mauro Salotti','Ramiro Carrillo']),
    ('metro','2014', 'Pablo Simone', array['Mauro Salotti','Ramiro Carrillo']),
    ('metro','2015', 'Pablo Simone', array['Mauro Salotti','Ramiro Carrillo']),
    ('metro','2016', 'Pablo Simone', array['Mauro Salotti','Ramiro Carrillo']),
    ('metro','2017', 'Pablo Simone', array['Mauro Salotti','Ramiro Carrillo']),
    ('metro','2018', 'Pablo Simone', array['Mauro Salotti','Ramiro Carrillo']),
    ('metro','2019', 'Pablo Simone', array['Mauro Salotti','Ramiro Carrillo']),
    ('liga1','2010', 'Ezequiel Gonzalo', array['Juan Iaksch']),
    ('liga1','2011', 'Ezequiel Gonzalo', array['Juan Iaksch']),
    ('liga1','2012', 'Ezequiel Gonzalo', array['Juan Iaksch']),
    ('liga1','2013', 'Ezequiel Gonzalo', array['Juan Iaksch']),
    ('liga1','2014', 'Nicolás Rayts', array['Nicolás Duboski','Sebastián Córdoba']),
    ('liga1','2015', 'Nicolás Rayts', array['Nicolás Duboski','Sebastián Córdoba']),
    ('liga1','2016', 'Nicolás Rayts', array['Nicolás Duboski','Sebastián Córdoba']),
    ('liga1','2017', 'Nicolás Rayts', array['Nicolás Duboski','Sebastián Córdoba']),
    ('liga2','2010', 'Diego Leyes', array['Ricardo Herrera','Tiago Fernández']),
    ('liga2','2011', 'Diego Leyes', array['Ricardo Herrera','Tiago Fernández']),
    ('liga2','2012', 'Diego Leyes', array['Ricardo Herrera','Tiago Fernández']),
    ('liga2','2013', 'Bruno Gismondi', array['Ricardo Herrera','Federico Álvarez']),
    ('liga2','2014', 'Bruno Gismondi', array['Ricardo Herrera','Federico Álvarez']),
    ('liga2','2015', 'Bruno Gismondi', array['Ricardo Herrera','Federico Álvarez']),
    ('liga2','2016', 'Bruno Gismondi', array['Ricardo Herrera','Federico Álvarez']),
    ('edefi','2010', 'Tiago Fernández', array['Emmanuel Muñoz']),
    ('edefi','2011', 'Tiago Fernández', array['Emmanuel Muñoz']),
    ('edefi','2012', 'Tiago Fernández', array['Emmanuel Muñoz']),
    ('edefi','2013', 'Tiago Fernández', array['Emmanuel Muñoz'])
),
groups_id as (
  select
    g.tira,
    c.id as category_id,
    pt.id as titular_id,
    (select jsonb_agg(p2.id) from profes p2 where p2.full_name = any(g.suplente_names)) as suplente_ids
  from groups g
  join categories c on c.name = g.cat_name
  join profes pt on pt.full_name = g.titular_name
),
slot_expand as (
  select
    ts.id as orig_id, ts.club_id, ts.day_of_week, ts.start_time, ts.end_time,
    t.value as tira, cid.value::uuid as category_id
  from training_slots ts
  join orig_slots_before osb on osb.id = ts.id
  cross join lateral jsonb_array_elements_text(ts.tiras) t
  cross join lateral jsonb_array_elements_text(ts.category_ids) cid
  where ts.is_active = true
),
resolved as (
  select
    se.club_id, se.day_of_week, se.start_time, se.end_time, se.tira,
    gi.titular_id, gi.suplente_ids, se.category_id, se.orig_id
  from slot_expand se
  join groups_id gi on gi.tira = se.tira and gi.category_id = se.category_id
),
new_rows as (
  select
    club_id, day_of_week, start_time, end_time, tira, titular_id, suplente_ids,
    jsonb_agg(distinct category_id) as category_ids,
    string_agg(distinct orig_id::text, ', ') as orig_ids_txt
  from resolved
  group by club_id, day_of_week, start_time, end_time, tira, titular_id, suplente_ids
)
insert into training_slots (club_id, day_of_week, start_time, end_time, court, category_ids, tiras, profe_titular_id, profe_suplentes_ids, notes, is_active)
select
  club_id, day_of_week, start_time, end_time, null, category_ids,
  jsonb_build_array(tira), titular_id, coalesce(suplente_ids, '[]'::jsonb),
  'Split automático 2026-07-07 desde turno(s) multi-tira original(es): ' || orig_ids_txt || ' — profe asignado según planilla "Profesores x tiras"',
  true
from new_rows;

-- Desactivar exactamente los turnos que existían antes de este script (los nuevos,
-- insertados arriba, no están en orig_slots_before).
update training_slots ts
set is_active = false,
    notes = coalesce(ts.notes || ' — ', '') || 'Reemplazado 2026-07-07 por turnos separados por tira (uno por tira, ver notes de los nuevos).'
from orig_slots_before osb
where ts.id = osb.id;

commit;
