# Migración a producción real — Plantel / Banfield

**Disparador:** demo aprobada por el piloto (Filial Banfield Ramos Mejía), 16-jun-2026.
**Objetivo:** pasar de modo demo (localStorage + ~450 jugadores mock) a base real Supabase con el plantel verdadero (~440 jugadores) cargado.

---

## Estado de partida (16-jun-2026)

- App en `DEMO_MODE=true`, Supabase en `placeholder` (`.env.local`).
- Migración SQL completa ya escrita: `supabase/migrations/0001_init.sql` (685 líneas, multi-tenant + RLS). **Nunca aplicada.**
- Base de jugadores real recibida: `Planilla Banfield 2.numbers` → parseada a `data-import/planilla_banfield_raw.csv` + `data-import/ROSTER-REVISION.md`.

## La base real (planilla)

- **440 jugadores** en 4 ligas activas: Liga Metropolitana (157), Liga Buenos Aires 1 (122), Liga Buenos Aires 2 (115), Liga EDEFI (27). Mundialito está vacío (estructura futura).
- Categorías = año de nacimiento (2010 a 2019).
- **Mapeo a modelo Plantel:** `categoria` = año nac.; `tira` = liga.
- **La planilla SOLO trae nombre + categoría + liga.** No trae DNI, fecha exacta de nacimiento, tutor ni contacto. Esos campos se completan después (self-onboarding por tutores — Sprint 1 ya existe — o carga manual).
- Columnas mensuales = seguimiento de pago/estado (E, T, B, H, montos, "Anticipado"...). Se conservan en el CSV raw; no son parte del alta del jugador.

---

## Plan de pasos

### Paso 0 — Revisión del roster (Diego)
Revisar `data-import/ROSTER-REVISION.md` y confirmar qué categorías/ligas se cargan primero (o todas).

### Paso 1 — Crear proyecto Supabase real  ⚠️ requiere OK de Diego (costo)
- **Decisión tomada (16-jun):** proyecto Supabase DEDICADO y aislado para Banfield/Plantel. NO compartir base con ningún otro proyecto (ni el core strategic-ia `flhmbeklzvrmjmjhxmmd`, ni Campus, ni Aromas). DB separada + RLS propias.
- Se crea como proyecto nuevo dentro de la org `ialsjnfqiirxzjnszjoa` (dbarrado@strategic-ia.com).

### Paso 2 — Aplicar migración
- Correr `supabase/migrations/0001_init.sql` en el proyecto nuevo.
- Verificar RLS por club.

### Paso 3 — Seed del club + catálogos
- Insertar club Filial Banfield Ramos Mejía (colores, escudo `public/escudo-banfield.png`, plan).
- Crear categorías (2010–2019) y tiras (las 4 ligas).

### Paso 4 — Importar jugadores
- Script que toma el CSV y crea los 440 players con `full_name`, `category_id`, `tira`, `is_active`, marcados como **ficha incompleta** (falta DNI/nac/tutor).

### Paso 5 — Modo REAL por club (Banfield real, resto demo)  🟡 Etapa 1 hecha
**Decisión (16-jun):** NO se apaga demo global. Cada club corre en su modo: Banfield = real (Supabase), el resto = demo (para seguir mostrando el producto a prospectos).

Implementación etapa 1 (lectura real de Banfield):
- `lib/supabase.ts` — cliente browser (anon key); null si el env es placeholder.
- `lib/real-clubs.ts` — `REAL_CLUBS` mapea `club-banfield-rm` → club Supabase `b1f1e1d0-…`; `LIGA_TO_TIRA` mapea ligas reales → códigos de tira del demo.
- `lib/demo-data.ts` — Banfield sale de `LEGACY_CLUB_IDS`; nuevas `hydrateRealClub()` / `isHydratedRealClub()`; getters devuelven SOLO datos reales para clubes hidratados (sin fallback a demo).
- `components/layout/data-provider.tsx` — al entrar, si el club activo es real, trae jugadores+categorías de Supabase, los inyecta en memoria y recién ahí renderiza (splash "Cargando datos del club…").
- `app/(dashboard)/layout.tsx` — envuelve el dashboard con `<DataProvider>`.
- `.env.local` — URL + anon key reales; `DEMO_MODE=true` se mantiene (los clubes demo lo necesitan).

Resultado: con Banfield activo, `/socios` y la ficha muestran los **440 jugadores reales**. Los otros clubes siguen demo, intactos.

**Pendiente etapa 1 (cosmético / a confirmar):**
- `demoPayments` es legacy global → los reales aparecen como "deudor" (no hay cuotas reales cargadas). Decidir si ocultar estado de cuota para Banfield o cargar billings reales.
- `/carnet` y `/padres` están fuera del layout dashboard → todavía no hidratan real.
- Verificar `tsc --noEmit` + build (pendiente: clasificador de Bash caído al implementar).

### Paso 5b — Escritura real (etapa 2)
Hoy las operaciones de Banfield (cobros, asistencia, convocatorias, partidos) escriben al store en memoria, NO a Supabase. Wirear los write-paths a Supabase para que persistan. Es el bloque de ingeniería que sigue.

### Paso 6 — Auth real + onboarding
- Supabase Auth, usuarios del club (admin/profe/tesorero/coordinador).
- Activar self-onboarding por tutores para completar fichas faltantes.

---

## Servicios simulados a reemplazar (ver `POST-DEMO.md`)
OCR de comprobantes, email transaccional a deudores, storage de fotos/aptos/comprobantes, cron de generación de cuotas.
