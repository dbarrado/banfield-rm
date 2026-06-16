# Estado actual — Plantel / Banfield (handoff)

**Última actualización:** 2026-06-16
**Para:** retomar el trabajo en otra PC.

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
