-- Rol `asistencia_manana`: firma la asistencia de los turnos que arrancan antes de
-- las 14:00 (cualquier tira/categoría), sin el resto de las atribuciones del coordinador.
-- Permite delegar la toma de asistencia de la mañana sin entregar el rol completo.
--
-- `user_clubs.roles` ya es text[] (multi-rol), así que no hay cambio de esquema:
-- solo se amplía el conjunto de valores válidos y se asigna a los coordinadores,
-- que son quienes hoy vienen tomando la asistencia de la mañana.

comment on column user_clubs.roles is
  'subset de: super_admin, admin, profe, tesorero, coordinador, asistencia_manana';

update user_clubs
set roles = array_append(roles, 'asistencia_manana')
where 'coordinador' = any(roles)
  and not ('asistencia_manana' = any(roles));
