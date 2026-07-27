# Estado actual — Plantel / Banfield (handoff)

**Última actualización:** 2026-07-23
**Para:** retomar el trabajo en otra PC.

## Update 2026-07-24 (g) — Guías v2 con el plan mensual
- Video del coordinador re-ensamblado (3:32): sección 4 regrabada con la planificación mensual,
  replicación y autocompletar (capturas 40/41 tomadas en PROD como Morel, con planes de muestra
  cat 2010 semana 3-7 ago — borrarlos cuando Diego termine de probar). PDF Guía Coordinador v2 ídem.

## Update 2026-07-24 (f) — Plan de entrenamiento MENSUAL con replicación y autocompletar
- **Pedido de Diego:** el coordinador planifica MENSUALMENTE (mes → semanas → días) y necesita
  replicar fácil: mismo plan a otros días, a otras categorías, y semanas enteras a otras semanas.
  Más autocompletar de ejercicios al cargar.
- **Nuevo `/plan` para coordinador/admin** (el profe puro mantiene su vista simple solo lectura):
  grilla mensual por semanas con dots, editor de día con total de minutos, y 3 replicaciones
  (días multi-select / categorías multi-select / semana entera ⧉ respetando día de semana).
  Detalle completo en BLUEPRINT §6.4c.
- **Autocompletar**: `loadExerciseLibrary` arma la biblioteca del club desde `session_plan_items`
  (frecuencia + minutos típicos); sugiere al enfocar (top 5) y al escribir (filtro sin tildes).
  También títulos. Se re-aprende en cada guardado.
- **Verificado en dev con login real de Morel** (script `data-import/cdp-verify-plan-mensual.mjs`,
  sandbox diciembre-2026, datos TEST borrados): guardar ✓, duplicar a 2 días ✓, a categoría 2014 ✓,
  semana entera ✓ (dots correctos), autocompletar ✓ (requiere focus emulation en headless).
- **GOTCHAS de testing CDP aprendidos:** (1) `const` en Runtime.evaluate queda en scope global —
  envolver SIEMPRE en IIFE o el segundo eval tira SyntaxError silencioso; (2) `.fixed` matchea la
  bottom-nav — usar `.fixed.inset-0` para modales; (3) los eventos de foco en headless requieren
  `Emulation.setFocusEmulationEnabled`.

## Update 2026-07-24 (e) — Revisión coordinador + fix próximos partidos + guía coordinador
- **Revisión del rol coordinador con login real (Morel):** todo funciona — ve los 7 turnos del día
  en asistencia, plan editable, asistencia de profes con titulares/suplentes reales, selector libre
  de profes en convocatoria, 9 partidos en fixture, cronograma (99 turnos) y socios con plata.
- **Fix deployado:** "Próximos partidos" del dashboard (admin/coordinador) ahora usa events reales
  (`loadMatchEvents`) desde hoy y muestra fecha/hora en horario LOCAL (bug: timestamptz UTC
  mostraba sáb 10:00 como vie 13:00). Tira desde `events.tira`.
- **Guía del coordinador** (PDF + video 3:07) en `data-import/instructivo-coordinador/` (gitignored,
  mismo motivo PII). Mismo pipeline que la de profes.
- **Guía de profes v2:** portada con el escudo real del club (`public/escudo-banfield.png`),
  sección PREGUNTAS FRECUENTES basada en persona ("Profe Colo", avatar generado con gpt-image-2):
  listados desactualizados (baja/alta/tira equivocada → coordinador; invitados → "Otros que
  vinieron"), asistencia olvidada/errónea (flechas + REABRIR), certificado tardío, clave olvidada
  (resetea el club), partido sin cargar, % injusto (override "Excepción" en no elegibles), sin señal.
- Videos de ambas guías con escudo en la portada.

## Update 2026-07-24 (d) — "Mi clave" + instructivo para profes (PDF y video)
- **Página `/clave` ("Mi clave")**: cualquier usuario logueado cambia SU contraseña
  (`supabase.auth.updateUser`, mínimo 8). En el menú de todos los roles. Motivo: los profes
  entran con clave inicial estándar y ahora pueden reemplazarla solos. Deployado.
- **Instructivo para profes** (pedido de Diego: simple y bien gráfico): PDF + HTML standalone con
  capturas REALES de producción (vista de Bruno, viewport celular). Incluye clave inicial y cómo
  cambiarla. Vive en `data-import/instructivo-profes/` (**gitignored a propósito**: el repo es
  público y las capturas tienen nombres de menores). Capturas reproducibles con
  `data-import/cdp-capturas-instructivo.mjs` (datos de muestra se insertan y revierten).
- **Video instructivo** (2:44, 1080x1920 vertical, ~12 MB, WhatsApp-ready): placas HTML→PNG por
  sección + voz TTS OpenAI `gpt-4o-mini-tts` (voz "ash", instrucción rioplatense; key personal
  global — NO se usó la key ElevenLabs de Aromas por regla de no cruzar keys entre proyectos) +
  ffmpeg (zoompan + fades + concat). Pipeline completo en `data-import/instructivo-profes/video/`
  (guion.json + gen-slides.mjs + gen-audios.mjs). Regenerable al cambiar la app.

## Update 2026-07-24 (c) — Dashboard propio del profe
- **Definición de Diego (AskUserQuestion):** bloques "Mis clases de hoy" + "Plan del día" +
  "Baja asistencia"; KPIs de club (socios/recaudado/deudores) FUERA para el profe.
- Nuevo `components/profe-dashboard.tsx`; `/dashboard` hace early-return con él para profe puro
  (header + quick actions por rol se mantienen). Bloques:
  1. **Mis clases de hoy**: `training_slots` del día filtrados por `profe_assignments` (cat×tira),
     hora/categorías/tira/cancha + botón a /asistencia; tilde "Tomada" si la categoría ya tiene
     práctica registrada hoy (`loadPracticeCategoriesForDate`, nuevo en attendance-store).
  2. **Plan del día**: `loadPlan` de las categorías de los turnos de hoy, solo lectura.
  3. **Para seguir — baja asistencia**: `loadPracticeStats` por categoría, jugadores de sus
     (cat×tira) con % < umbral (demoEligibilityConfig), orden ascendente, top 8.
- Verificado vía CDP como Bruno: 3 clases reales del viernes, sin Recaudado/Deudores/Socios activos.
- Nota: el dashboard de admin/coordinador quedó igual (incluye "Próximos partidos" que para el club
  real sigue calculando con demo/fecha fija — pendiente de wirear a loadMatchEvents).

## Update 2026-07-24 (b) — Profe puro no ve plata en socios
- **Definición de Diego (AskUserQuestion):** el profe ve "todo menos plata" en la ficha del socio,
  y la excepción semanal la puede cargar también él (queda como estaba).
- **Ficha del socio** (profe puro): ocultos la card "Cuota" (Al día/Deudor), "HISTORIAL DE PAGOS",
  los % de descuento por hermanos (la lista de hermanos sigue visible) y el mensaje de WhatsApp
  pasa a saludo neutro (nunca menciona deuda). Sigue viendo: datos del chico, tutor completo,
  apto médico, posiciones, evaluación, asistencia, excepción semanal (editable).
- **Listado de socios** (profe puro): ocultos el filtro "🚩 Deudores", el punto de color de estado
  de cuota sobre el avatar y el botón de WhatsApp de deuda.
- **NOTA pendiente (dicho a Diego):** los botones de edición de datos personales/tutor en la ficha
  siguen abiertos a cualquier rol logueado — restringirlos si Diego lo pide.
- Verificado vía CDP con login real de Bruno (profe): sin chip Deudores ni cards de plata;
  excepción y tutor visibles. `tsc` + `build` verdes.

## Update 2026-07-24 — Justificaciones: botón en asistencia + excepción fija semanal
- **Botón "ausente justificado" en `/asistencia`:** el estado `absent_justified` existía en el tipo,
  la base (columna `justified_reason` incluida) y la fórmula de elegibilidad, pero la UI no tenía
  forma de marcarlo. Cuarto botón azul (AlertCircle) en la ficha de cada chico. El tap-cycle de la
  ficha no cambia (unmarked→present→late→absent→unmarked). Justificación retroactiva: navegar al
  día, REABRIR, cambiar el estado, guardar — el % se recalcula al instante porque la convocatoria
  lee la base en vivo.
- **Excepción fija semanal (pedido de Diego: "no viene los martes por el colegio"):**
  - Migración `0004_player_exempt_days.sql` (aplicada): `players.exempt_days smallint[]`
    (0=Dom..6=Sáb, misma convención que `training_slots.day_of_week`) + `players.exempt_reason text`.
  - **Ficha del socio**: card "EXCEPCIÓN SEMANAL" — chips de días + motivo, persiste con
    `updatePlayer` (probado bajo RLS con login real: update+select+revert OK).
  - **Asistencia**: al abrir un día SIN asistencia guardada, los chicos exceptuados ese día se
    precargan como ausente justificado (ficha azul) con la leyenda "No viene este día — motivo".
    El profe puede pisarlo si el chico vino igual. Si ya hay asistencia guardada para el día, se
    respeta lo guardado (no se pisa al editar).
  - Efecto en elegibilidad: el justificado descuenta el denominador → el % no se ve afectado.
- Hidratación de `players` extendida con los dos campos nuevos (data-provider).

## Update 2026-07-23 (c) — Los % de la convocatoria ahora salen de la asistencia REAL
- **Reporte de Diego:** tomó asistencia hoy (cat 2013) y los porcentajes de la convocatoria no
  la reflejaban. Causa: `getAttendanceStats` (demo-data) calcula sobre `demoEvents`/`demoAttendance`
  en memoria — la asistencia real se guardaba en Supabase pero nunca se leía para elegibilidad
  (mismo patrón que el fixture en el update (a)).
- **Fix:** `loadPracticeStats(clubId, categoryId)` en `lib/data/attendance-store.ts` — lee events
  practice + attendances de la categoría y devuelve stats por jugador. La convocatoria (club real)
  usa eso en vez del cálculo demo. Detalles de la fórmula:
  - El **total es POR JUGADOR** (prácticas donde tiene registro), no el total de eventos de la
    categoría: en categorías multi-tira cada tira firma su propia práctica y un chico no debe ser
    penalizado por prácticas de otra tira.
  - `late` cuenta como asistió; `absent_justified` descuenta el denominador (igual que demo).
  - Sin registros → total 0 → elegible (sin datos no se bloquea a nadie).
- **Verificado** contra la base (cat 2013: 6 chicos 100%, 18 con 50%, 47 con 0% — la UI coincide)
  y en la app vía CDP con login real.

## Update 2026-07-23 (b) — Permisos de profe: partidos solo suyos, plan solo lectura, flyer desde galería
- **Pedidos de Diego (mismo día, segunda tanda):**
  1. **Plan de entrenamiento**: lo define el coordinador; el profe puro ahora lo ve SOLO LECTURA
     (`/plan` sin textareas ni guardar; muestra ejercicios como tarjetas; "el coordinador todavía no
     cargó el plan" si está vacío). Coordinador/admin siguen editando igual.
  2. **Fixture filtrado**: profe puro ve SOLO los partidos de sus (categoría, tira) asignadas
     (`isMine()` contra `profe_assignments`; partidos sin tira matchean por categoría).
  3. **Alta de partido limitada**: tanto el modal "Nuevo partido por tira" de `/fixture` como
     `/partidos/generar` ofrecen al profe puro solo SUS tiras y SUS categorías (y `validRows`
     valida contra las permitidas, por si la IA del flyer mapea una categoría ajena).
  4. **Flyer desde galería**: `/partidos/generar` ahora tiene dos botones — "Sacar foto del flyer"
     (input con `capture`) y "Elegir de la galería" (input sin `capture`, que en el celu abría
     solo la cámara).
- **Verificado con login real de profe** (Bruno Gismondi, liga2 cats 2013-2016): fixture muestra 3/6
  partidos (los suyos), plan solo lectura con sus 4 categorías, generar ofrece solo su tira.
  Script `data-import/cdp-verify-profe.mjs` (reusable). GOTCHA de testing: limpiar cookies antes de
  loguear otro usuario — con sesión previa /login redirige al dashboard y el login nuevo no ocurre.
- **Regla operativa nueva (en CLAUDE.md): todo cambio verificado se commitea y pushea a producción**
  (Vercel). Un cambio local sin pushear no existe para el club.

## Update 2026-07-23 — Convocatoria "de la semana" + fixture real + alta manual de partidos
- **Premisa nueva (pedido de Diego): entrar a Convocatoria = convocar esta semana.** En
  `/convocatoria` ya no hay que elegir partido en un dropdown: el partido de los próximos 7 días
  para la (categoría, tira) activa se auto-selecciona y se muestra como banner verde ("Esta semana:
  vs Rival — sáb 26 jul 10:00 · sede"). Si no hay en la semana, toma el próximo existente
  ("Próximo partido"); si no hay ninguno, banner punteado "Sin partido cargado esta semana —
  convocás igual" con link "+ Cargar partido" a `/fixture`. "Cambiar" aparece solo con 2+ candidatos.
  Los partidos con `events.tira` se filtran por la tira activa.
- **Fix estructural: los partidos reales ahora SE LEEN.** `createMatchEvents` escribía en Supabase
  pero nada los leía de vuelta (fixture y convocatoria miraban solo memoria demo → para el club real
  no aparecían). Nueva `loadMatchEvents()` en `lib/data/ops-store.ts`; la consumen `/fixture` (hidrata
  al entrar) y `/convocatoria`. `Event.tira` agregado al tipo (la columna ya existía en la base).
- **Alta de partidos no solo desde el flyer:** (a) el modal "Nuevo partido por tira" de `/fixture`
  (que era demo-only) ahora persiste con `createMatchEvents` para el club real, pasando la tira, y
  recarga el fixture con ids reales; (b) `/partidos/generar` suma botón "Cargar a mano (sin flyer)"
  que abre el mismo formulario de revisión vacío. Título pasó a "GENERAR PARTIDO".
- **Probado contra Supabase con login real** (script `data-import/test-match-events.mjs`):
  insert+select+delete de events OK, la tira va y vuelve. En la base hay 6 partidos históricos
  vs Atlas (28-jun, liga2) de la prueba original del flyer.
- **Pendiente:** reprogramar/suspender partidos en `/fixture` siguen solo en memoria para el club
  real (no persisten). `tsc --noEmit` y `next build` en verde.

## Update 2026-07-16 — rol `asistencia_manana` + verificación de las altas de profes
- **Altas verificadas (nada que hacer):** los 16 profes de `profes` tienen usuario de Supabase Auth con su email, email confirmado y la clave estándar seteada. Roles en `user_clubs`: 14 `profe`, Emmanuel Muñoz `coordinador`+`profe`, Edgardo Morel `coordinador`. Al 16-jul solo Bruno Gismondi se había logueado alguna vez.
- **Login real probado en la app** (dev server + CDP): Pablo Simone y Mauro Salotti (profes puros) ven solo sus clases del día con los chicos correctos; Salotti confirma que el caso "profe sin turnos como titular" funciona, porque `mySlots` resuelve por `profe_assignments`. Edgardo Morel (coordinador) ve todos los turnos del día.
- **Rol nuevo `asistencia_manana`:** firma la asistencia de los turnos que arrancan antes de las 14:00, sin el resto de las atribuciones del coordinador. Ver detalle en `BLUEPRINT.md` §4. Código: `lib/use-role.ts` (rol, label, nav), `lib/training-roster.ts` (`MORNING_END`, `isMorningSlot`), `app/(dashboard)/asistencia/page.tsx` (`isMorningTaker`, `relevantSlots`), `app/(dashboard)/dashboard/page.tsx` (quick actions).
- **Asignado a los dos coordinadores** (Morel y Muñoz) vía `supabase/migrations/0003_rol_asistencia_manana.sql`, ya aplicada. Para ellos no cambia nada — `admin`/`coordinador` absorben el rol y siguen viendo el día completo. El rol existe para poder delegar la asistencia de la mañana a alguien que NO sea coordinador. Probado en aislamiento (dejando a Morel solo con ese rol): ve los 9 turnos de la mañana del jueves y ninguno de la tarde.
- **`tsc --noEmit` y `next build` en verde** en esta sesión (Node disponible).
- **Riesgo de seguridad abierto:** el usuario admin `dbarrado@strategic-ia.com` tiene la MISMA clave estándar que los 16 profes. Cualquiera de ellos entra como admin (cuotas, caja, datos de 450 chicos). Cambiar antes de repartir accesos.

## Update 2026-07-07 — `mySlots`/categorías de asistencia ya no confían en `training_slots.profe_titular_id` + migración que separa turnos por tira
- **Contexto:** se detectó (auditando Supabase contra la planilla fuente `Profesores x tiras (1).docx`, en Descargas del usuario) que `profe_assignments` está bien cargado (coincide 100% con la planilla), pero `training_slots` (el cronograma real armado a mano en Supabase) tenía turnos con `category_ids`/`profe_titular_id`/`profe_suplentes_ids` desalineados de la planilla. Causa raíz: muchos turnos agrupaban 2-4 tiras simultáneas (mismo horario, distinta cancha) bajo un único `profe_titular_id`, cuando cada tira tiene su propio plantel en la planilla. Caso más grave: Matías Villegas habilitado para Metro 2010-2012, pero cargado como titular de un turno Liga Ramos 2017-2018.
- **Fix frontend en `app/(dashboard)/asistencia/page.tsx`:** `mySlots` (turnos del profe puro) y las categorías que se muestran/seleccionan por turno (`loadSlot`, `profeAllowedCategoryIds`, la tarjeta "Tu clase") ya NO usan `profe_titular_id`/`profe_suplentes_ids` del turno para decidir qué le corresponde a un profe. En su lugar, nueva función `myValidCategoriesInSlot(slot, profeId)` cruza `slot.category_ids` × `slot.tiras` contra `getProfesForTira()` (que resuelve contra `profe_assignments` real, hidratado desde Supabase).
- **Fix de datos — migración `supabase/migrations/0002_split_training_slots_by_tira.sql`** (aplicada a Supabase el 2026-07-07): separó cada turno multi-tira en una fila por tira (y, dentro de cada tira, por el límite Juveniles/Infantiles de la planilla cuando un turno cruzaba ese límite bajo un solo profe). El titular/suplentes de cada fila nueva sale 1:1 de la planilla, no de lo que había cargado antes. Resultado: 35 turnos originales desactivados (`is_active=false`, quedan de historial) → 99 turnos nuevos, uno por tira, con el profe correcto. Categorías/tiras sin ningún profe en la planilla (ej. edefi 2014-2017, liga2 2017-2018, liga1 2018-2019) se descartaron — no existe nadie a quien asignarles esa clase. "2019" no está en la planilla; se asumió que sigue en el grupo Metro Infantiles (Pablo Simone/Mauro Salotti/Ramiro Carrillo) — **a confirmar con el club**.
- **No se tocó:** `/asistencia-profes` (asistencia *de* profes, para pagos/control) sigue usando `profe_titular_id`/`profe_suplentes_ids` tal cual — ahí interesa quién efectivamente trabajó ese turno puntual.
- **Pendiente:** confirmar con el club el supuesto sobre categoría "2019", y revisar si algún turno con categorías/tira sin profe en la planilla (los que quedaron "huérfanos" al separar) necesita cargarse manualmente. Detalle turno por turno del estado previo en `profes-tiras-categorias-inconsistencias.md` (Descargas del usuario, desactualizado post-migración pero útil como bitácora).
- **No se pudo correr `tsc`/`build`** en esta sesión: sandbox sin `node`/`npm`/`npx` en el PATH (mismo problema que sesiones anteriores). Revisar en verde con Node disponible antes de deployar.

## Update 2026-06-30 (b) — Asistencia: navegación por día + edición sin duplicar
- `/asistencia` (club real) ahora navega por día (`viewDate`, barra `‹ Hoy ›`, sin avanzar a futuro). El cronograma del día (`daySlots`) y, para profe puro, sus turnos (`mySlots`) se recalculan por `day_of_week` de `viewDate`, no por `new Date()` fijo.
- Auto-selección de turno: hoy → activo ahora / próximo / último pasado; día pasado → primer turno del día. Profe puro con +1 turno el mismo día ve el actual destacado y el resto colapsado en "Ver tus otras clases".
- **Edición sin duplicar**: nuevo `loadAttendanceForDate()` en `lib/data/attendance-store.ts` busca el evento de práctica (categoría+día) ya guardado y precarga sus registros (`currentEventId`, `closed=true`, se reutiliza el botón "REABRIR" ya existente para editar). `persistAttendanceClose` se reemplazó por `persistAttendanceUpsert` (si recibe `eventId`, borra+reinserta attendances de ese evento en vez de crear uno nuevo; `persistAttendanceClose` queda como alias retrocompatible sin `eventId`).
- **Limitación conocida**: `loadAttendanceForDate` matchea solo por categoría + día calendario, no por tira/turno — si un día tuviera dos eventos de práctica para la misma categoría (turnos distintos), trae el más reciente por `scheduled_at`. No bloqueante para Banfield hoy (1 turno por categoría/día en la práctica), pero a tener en cuenta si se agregan turnos dobles.
- Archivos: `app/(dashboard)/asistencia/page.tsx`, `lib/data/attendance-store.ts`.
- **No se pudo correr `tsc`/`build`** en esta sesión: sandbox sin `node`/`npm`/`npx` en el PATH. Pendiente verificar en verde con Node disponible.

## Update 2026-06-30
- **Aislamiento de profe puro (no ve datos de todo el club).** Antes el rol activo era 100% simulado (`localStorage`) y cualquier rol podía elegir libremente cualquier profe en los selectores. Ahora, en club real:
  - `lib/use-role.ts` → `useUserRoles()` lee `user_clubs.roles` (Supabase, `user_id` del usuario logueado), con cache en memoria por sesión de navegación. `useActiveRole()` se autocorrige si el rol guardado no está entre los roles reales del usuario. Club demo sigue igual (localStorage).
  - `lib/use-current-profe.ts` (nuevo): resuelve `{ profeId, profeName }` matcheando el email de `auth.getUser()` contra `profes.email` (case-insensitive). Devuelve null en clubes demo.
  - `/asistencia`, `/convocatoria`, `/plan`: si el rol activo es `profe` puro (sin `admin`/`coordinador` en sus roles), el selector de profe se bloquea (muestra su nombre fijo) y se autoselecciona su `profeId`; en `/plan` además se filtra el selector de categoría a sus asignaciones (`getAssignmentsForProfe`). Admin/coordinador: sin cambios, selector libre.
  - **Pendiente / no bloqueante:** `/asistencia-profes` no se tocó (sigue con roster demo en algunos casos, ver TODO ya documentado abajo). Defensa en profundidad server-side (RLS por profe en `training_slots`/`profe_assignments`) quedó como TODO comentado en `lib/data/ops-store.ts` — hoy el filtrado es solo frontend, protegido igual por RLS multi-tenant (no anon).
  - **No se pudo correr `tsc`/`build`** en esta sesión: el entorno no tiene `node`/`npm`/`npx` en el PATH (sandbox sin Node instalado). Revisar en verde en la próxima sesión con Node disponible antes de deployar.

## Update 2026-06-25
- **Asignaciones profe→tira/categoría ahora se consumen en el club real.** La tabla `profe_assignments` (73 filas, cargada con la grilla "Profesores x tiras", Bruno incluido) ya existía pero la app solo leía datos demo. Se agregó:
  - `loadProfeAssignments()` en `lib/data/ops-store.ts` (lee `profe_assignments`, scope por RLS).
  - Hidratación de profes + asignaciones reales en `components/layout/data-provider.tsx` (vía `loadProfes` + `loadProfeAssignments`).
  - En `lib/demo-data.ts`: mapas `realProfesByClub`/`realAssignmentsByClub` (NO se mezclan con los arrays demo), `hydrateRealClub()` extendido, y accessors club-aware: `getProfesForClub()`, `getProfeById()`, y `getProfesForTira()`/`getAssignmentsForProfe()` que resuelven real primero y demo de fallback.
  - Páginas migradas a esos accessors: `/convocatoria`, `/asistencia`, `/config/profes`. `Profe` ahora tiene `club_id?`.
  - `tsc` + `next build` en verde.
- **PENDIENTE (no se tocó, evita parche engañoso):** `/asistencia-profes` lee el roster **demo** (`demoTrainingRoster`/`getSlotsByDay`), no el `training_slots` real → para el club real muestra turnos/profes demo. Necesita wiring al cronograma real (patrón de `/asistencia` con `loadTrainingSlots`). Las páginas de match-ratings (`/partidos/[id]/puntajes`, `socios/[id]`, `reportes/rendimiento-deportivo`) siguen con profes demo (baja prioridad: `match_ratings` está vacía).
- **Sin deployar aún:** cambios solo locales, a la espera de OK para push/deploy.

## Update 2026-06-19
- **Módulo Plan de Entrenamiento construido** (`/plan`): el coordinador carga ejercicios por categoría y día; el profe lo ve arriba de la asistencia (`components/plan-del-dia.tsx`). Persiste en `session_plans`/`session_plan_items`. Probado.
- **15 profes cargados** (identidad: nombre+email, desde doc de Ema). Faltan teléfonos y horarios.
- **EDEFI completado**: 21 DNIs + 10 chicos nuevos (total 37). 6 quedaron sin DNI (no venían en el doc). Plantel total = **450**.
- **Depende de Ema (no se puede inventar):** horarios del cronograma (días/turnos mañana-tarde por categoría y profe), mapeo de tiras `BANFIELD RAMOS`/`BANFIELD RAMOS "A"` ↔ `Liga Buenos Aires 1/2`, email de Edgardo (chat: `moreledgardo06@gmail.com` vs doc: `edgardomorel@hotmail.com`), DNIs de las otras ligas. Detalle en `data-import/PEDIDO-EMA.md` (local, gitignored).

---

## Resumen en una línea
La app pasó de simulación a **producción real en Supabase** para el club Banfield. Los datos y **todos los módulos operativos persisten en Supabase** (probado bajo RLS). Los demás clubes siguen en modo demo. Queda 1 pendiente: inscripciones públicas (policy anon).

---

## Cómo retomar en una PC nueva

1. **Clonar el repo:**
   ```bash
   git clone https://github.com/dbarrado/banfield-rm.git
   cd banfield-rm
   npm install
   ```

2. **Crear `.env.local`** (NO está en git). Contenido:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://zdoogaxfuwavdhopemjn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_MLbrL4YmEkR4c7NzI4GBvQ_Yu-MHMT_
   SUPABASE_SERVICE_ROLE_KEY=placeholder
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_DEMO_MODE=true
   ```
   (La anon key es publishable, segura para el cliente. El service_role sigue sin usarse.)

3. **Correr:** `npm run dev` → http://localhost:3000

4. **Login del club real:** usuario `dbarrado@strategic-ia.com` · contraseña: la definida por Diego
   (NO se versiona; está en su gestor de contraseñas / se puede resetear desde el dashboard de Supabase
   o cambiando `encrypted_password` en `auth.users`).
   → entra a Banfield con datos reales (440 jugadores, cuotas, etc.).
   Cualquier otra credencial = modo demo (clubes ficticios para mostrar).

---

## Datos de la nube (Supabase)
- **Proyecto:** `banfield-plantel` · ref **`zdoogaxfuwavdhopemjn`** · región sa-east-1 · org strategic-ia (Pro).
- **Club real id:** `b1f1e1d0-0000-4000-8000-000000000001`.
- Acceso al dashboard Supabase con la cuenta `dbarrado@strategic-ia.com`.
- Las migraciones SQL versionadas están en `supabase/migrations/`. Los scripts de carga (con PII) viven solo local en `data-import/` (gitignored); la fuente de verdad es la base.

---

## Qué está hecho (todo probado, ver `PRODUCCION.md`)
- Proyecto aislado + 37 tablas + RLS multi-tenant. Hardening de seguridad aplicado.
- Auth real (Supabase) + usuario admin. RLS verificada: autenticado ve 440, anon 0.
- 440 jugadores + 9 categorías + 4 ligas + club. Cuota **$60.000**, **transferencia +10%**, 440 cuotas.
- **Escritura persistente en 17 tablas** (probado insert+verify+cleanup con login real):
  socios (alta/edición), cobranzas, caja (cobro/movimientos/sesión/cierre), asistencia, convocatoria,
  partidos (puntajes/observaciones), asistencia-profes, profes, cronograma, config (cuota/umbrales/códigos),
  tienda (products/orders), referidos.
- `tsc` y `next build` verdes.

## Arquitectura clave (para no romper nada)
- **Modo por club:** `lib/real-clubs.ts` define `REAL_CLUBS` (Banfield → id Supabase). `isRealClub(clubId)` decide
  si un módulo lee/escribe en Supabase (real) o en memoria (demo).
- **Lectura:** `components/layout/data-provider.tsx` hidrata jugadores/categorías/cuotas reales al entrar
  (gatea el render y exige sesión Supabase para el club real).
- **Escritura:** stores en `lib/data/` (`billing-store`, `attendance-store`, `players-store`, `ops-store`).
  Patrón en cada handler: `if (isRealClub(club.id)) persistAlgo(...)` + update local para UI.
- **Demos intactos:** clubes que no están en `REAL_CLUBS` siguen 100% en `lib/demo-data.ts`.

## Pendiente
- **Inscripciones públicas** (self-onboarding por tutores): requiere policy de `INSERT` para rol `anon`
  en `pending_registrations` (hoy RLS lo bloquea, que es lo seguro). Definir cómo limitar abuso
  (código de inscripción válido / rate-limit) antes de habilitar.
- Opcionales: foto de jugador a Storage, OCR real de comprobantes (ver `POST-DEMO.md`), edición de config
  de cobranza desde UI a Supabase.

## Para agregar otro club a producción
1. Insertar el club + sus datos en Supabase.
2. Agregar su entrada en `demoClubs` (`lib/clubs.ts`) y mapearlo en `REAL_CLUBS` (`lib/real-clubs.ts`).
3. Crear su usuario admin en auth + `user_clubs`.
