# Plan — filtros de convocatoria, convocar sin partido y turno del chico

**Fecha:** 2026-07-16 · **Estado:** planificado, nada implementado todavía.

Este documento sale de una prueba end-to-end contra Supabase real (club Banfield) con la app
corriendo y login real. Los datos sembrados para probar se borraron: la base quedó como estaba
(1 práctica del 7-jul con 71 asistencias, 6 partidos vs Atlas, 0 convocatorias).

---

## 1. Qué se probó y qué pasó

**Convocatorias: funcionan.** Con login real de admin, en 2014 / Metro se marcaron 16 chicos y se
guardó. Persistió en `convocations` (`event_id` null — convocatoria libre — `club_id`,
`category_id`, `tira='metro'`) más 16 filas en `convocation_players`. Al reabrir la misma
tira+categoría precargó los 16 y mostró "Convocatoria guardada · 16 jugadores" con el botón de
envío por WhatsApp. El flujo guardar → precargar → enviar está sano.

**Los filtros de elegibilidad NO funcionan.** Es el hallazgo importante y está desarrollado abajo.

**Simulacro de una semana de asistencia.** Se sembraron 3 prácticas de Metro 2014 (lunes 13,
miércoles 15 y jueves 16 de julio) con presentes 13/20, 17/20 y 17/20, y chicos que faltaron 1, 2 o
las 3 veces. Con esos datos cargados en la base, la pantalla de convocatoria siguió mostrando
**🏃 0% para los 20 chicos**, y a los 20 como elegibles. Ningún ausente quedó filtrado.

---

## 2. Bug P0 — la elegibilidad nunca mira los datos reales

**Qué pasa.** `getAttendanceStats()` (`lib/demo-data.ts:833`) calcula el % leyendo los arrays
`demoEvents` y `demoAttendance`. Pero `hydrateRealClub()` (`lib/demo-data.ts:1279`) sólo inyecta
jugadores, categorías, profes y asignaciones — **nunca eventos ni asistencias**. Para Banfield esos
arrays no tienen nada con los uuid reales, así que la cuenta de prácticas da cero.

**Por qué queda invisible.** En `app/(dashboard)/convocatoria/page.tsx:90` la regla es
`meetsPractice = percentage >= threshold || practiceStats.total === 0`. Con `total = 0` todos pasan.
El "0 prácticas todavía → no bloquear" es razonable en un club que arranca, pero acá enmascara que
el dato nunca llegó: la pantalla muestra 0% y habilita a todos, y los sliders de mínimo no hacen nada.

**Fix.** Traer las stats reales de Supabase en vez de los arrays demo:

1. Nueva función en `lib/data/attendance-store.ts`, por ejemplo
   `loadAttendanceStats(clubId, { categoryId, tira, desde?, hasta? })`, que agregue por jugador
   contra `events` + `attendances` y devuelva `{ playerId: { attended, justified, total, percentage } }`.
   Un solo query por tira+categoría, no uno por chico.
2. En `convocatoria/page.tsx`, para club real usar esas stats en lugar de `getAttendanceStats`.
3. Distinguir de verdad "sin datos" de "0%": si el club no tomó ninguna práctica, mostrar "—" y no
   "0%", y recién ahí no bloquear. Hoy los dos casos se ven igual y eso es lo que ocultó el bug.
4. El % de partidos está hardcodeado a `{ played: 0, total: 0, percentage: 0 }` para club real
   (`page.tsx:88`, con el comentario "sin partidos jugados aún"). Cuando haya partidos con asistencia
   cargada hay que calcularlo igual que las prácticas.

**Dos bugs de segundo orden que aparecen al tocar esto:**

- `page.tsx:87` pasa `selectedCategory` a `getAttendanceStats`, cuando todo el resto de la pantalla
  usa `effectiveCategory`. Si un profe tiene categorías acotadas y `selectedCategory` quedó en una
  que no le corresponde, las stats se calculan sobre la categoría equivocada.
- **El denominador no distingue tira.** `getAttendanceStats` cuenta todas las prácticas de la
  categoría. Si Metro 2014 entrena martes y jueves y Liga 1 2014 entrena lunes y miércoles, los
  cuatro eventos entran en el denominador de todos los chicos de 2014 — cada uno arrastra las
  prácticas de una tira a la que no va y el % le queda a la mitad. `events.tira` ya existe en la
  base, pero `persistAttendanceUpsert` no la escribe. Hay que empezar a guardarla y filtrar por ella.
  Esto ya afecta a `loadAttendanceForDate`, que hoy matchea sólo por categoría + día y tiene la
  limitación anotada en el propio archivo.

---

## 3. Convocar sin partido, eligiendo fecha y rival

**Estado.** La convocatoria libre ya existe (commit `3694700`): se puede guardar sólo con tira +
categoría y el selector dice "Sin partido — convocatoria por tira y categoría". Lo que falta es
poder decir **cuándo** y **contra quién**. Hoy el mensaje de WhatsApp sale con
`📅 Por definir` y `📍 A confirmar` (`page.tsx:161-168`), que es justo lo que hace que no sirva
para mandarla.

**Recomendación: crear el partido al vuelo, no duplicar el modelo.** Cuando el profe elige "sin
partido" y completa fecha + rival (+ local/visitante y cancha, opcionales), al guardar se inserta el
`event` de tipo `match` con esos datos y la convocatoria se ata a él por `event_id`. El nombre que
le puso Diego —"convocar un partido sin tenerlo generado"— se cumple: el usuario no lo genera, lo
genera el sistema.

Ventajas sobre agregar `match_date`/`rival` a `convocations`: el partido aparece solo en fixture y
en `/partidos`, queda disponible para cargar puntajes y observaciones después, el mensaje de
WhatsApp ya lee `event.scheduled_at` y `event.venue` (sale gratis), y no quedan dos fuentes de
verdad para "cuándo juega la 2014".

**Trabajo concreto:**

1. En el selector de partido, tercera opción: "Partido nuevo — cargar fecha y rival". Al elegirla se
   despliegan fecha, hora, rival, local/visitante y cancha. Rival y fecha obligatorios.
2. `saveConvocatoria()` (`page.tsx:141`): si es partido nuevo, primero `createMatchEvents()`
   (`lib/data/ops-store.ts:112`, ya existe y ya escribe `tira`), y con el id devuelto llamar a
   `persistConvocation({ eventId })`.
3. Reusar el evento si ya hay un partido de esa categoría+tira+fecha, para no duplicar cuando dos
   profes cargan lo mismo.
4. `generateWhatsApp()` no se toca: ya resuelve fecha/hora/cancha desde el evento.

`convocations.label` existe en la base y no lo usa nadie. Si se elige este camino, sirve para el
nombre libre del compromiso ("Amistoso", "Fecha 5") y no para el rival.

---

## 4. Marca de turno del chico (mañana / tarde)

**El dato ya tiene lugar y está vacío.** `players.shift` existe con
`check (shift in ('morning','afternoon'))` (`0001_init.sql:147`) y está en **null en los 450
jugadores**. La columna se lee y se hidrata (`data-provider.tsx:36`) pero nunca se usa ni se carga.

**La regla, según Diego:** el chico normalmente va a un turno, pero si falta puede ir al otro. O sea
es una **marca blanda, nunca un filtro**. Un chico de la tarde que aparece a la mañana tiene que
poder marcarse presente sin fricción. Esto descarta filtrar la lista por turno.

**Diseño propuesto para `/asistencia`.** Cuando el turno cargado es de la mañana
(`isMorningSlot`, `lib/training-roster.ts`), la lista se parte en dos bloques:

- **"Del turno mañana (N)"** — expandido, arriba. Los chicos con `shift='morning'`.
- **"Otros chicos (N)"** — colapsado, con un botón para desplegar. Los de `shift='afternoon'` y los
  que están en null.

A la tarde, espejado. Si no hay ningún chico con turno cargado, se muestra la lista entera como hoy
(sin bloques), para no romper la pantalla mientras el dato no exista. El contador y el "cerrar y
firmar" siguen contando sobre todos: el que está en el bloque colapsado y vino se marca igual, y al
marcarlo conviene subirlo al bloque de arriba para que quede a la vista.

**El problema real es cargar el dato**, no mostrarlo. No viene en ninguna planilla del club. Tres
vías, de menor a mayor esfuerzo del club:

1. **Aprenderlo de la asistencia.** Una vez que haya algunas semanas cargadas, inferir el turno de
   cada chico según dónde estuvo presente la mayoría de las veces, y proponerlo para confirmar. Es
   lo que menos trabajo le da al club, pero necesita que primero se tome asistencia un tiempo.
2. **Que lo marque el profe desde asistencia.** Un toque en la ficha del chico del bloque colapsado
   que diga "este viene siempre a la mañana" y le setee el `shift`. La marca se construye sola con el
   uso.
3. **Carga manual en la ficha de socio.** Un selector mañana/tarde/sin definir en
   `/socios/[id]`. Necesario igual como forma de corregir, pero cargar 450 a mano no va a pasar.

Recomiendo hacer 3 (es media hora y habilita todo lo demás), después 2 (el profe lo va marcando
mientras toma asistencia, sin trabajo extra), y dejar 1 para cuando haya historial.

**Ojo con el orden.** Este bloque colapsado alivia listas largas, pero las listas de hoy son largas
por otro motivo: en el turno de las 17:00 de Pablo Simone aparecen 54 chicos porque el turno agrupa
2014, 2015 y 2016. Partir por turno mañana/tarde no va a arreglar eso. Vale la pena ver si además
conviene agrupar por categoría con la misma mecánica de colapsar.

---

## 5. Bugs menores y deuda encontrados de paso

- **Click en la tira ya activa borra la convocatoria precargada.** `page.tsx:240` hace
  `setSelected(new Set())` al tocar la tira. Si esa tira ya era la activa, `effectiveTira` no cambia,
  el efecto de precarga no vuelve a correr y los convocados quedan borrados sin aviso. Sólo limpiar
  si la tira cambió de verdad.
- **Todos los chicos figuran como MEDIOCAMPISTAS.** En 2014/Metro los 20 caen en esa posición: el
  dato de `primary_position` está en el default. La convocatoria se organiza por posición, así que
  hoy esa agrupación no informa nada.
- **Migraciones que mienten.** `convocations.club_id/category_id/tira/label`, `convocations.event_id`
  nullable y `events.tira` están aplicadas en Supabase pero **no existen como archivo** en
  `supabase/migrations/`. `0001_init.sql` todavía declara `event_id ... not null` y `events` sin
  `tira`. Quien levante la base de cero desde las migraciones obtiene un esquema distinto al de
  producción. Hay que escribir la migración que falta (`0004_*`) reflejando lo ya aplicado.

---

## 6. Orden sugerido

1. La migración que falta (§5) — es la que hace que todo lo demás sea reproducible.
2. El bug P0 de elegibilidad (§2), incluida la tira en las prácticas. Sin esto los filtros de
   convocatoria son decorativos y los sliders no hacen nada.
3. Convocar con fecha + rival (§3).
4. Turno del chico (§4), empezando por poder cargar el dato.
