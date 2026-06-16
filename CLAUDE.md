# Plantel / Banfield — instrucciones del proyecto

App SaaS para clubes deportivos. Cliente en producción: **Filial Banfield Ramos Mejía**.
Stack: Next.js 16 + React 19 + TypeScript + Tailwind/shadcn + **Supabase** (Postgres + Auth + RLS).

## ⚠️ REGLA — Documentación viva (mantener SIEMPRE actualizada)

Después de **cualquier** cambio funcional o de arquitectura, antes de cerrar la tarea, actualizá:

1. **`BLUEPRINT.md`** — contrato funcional + arquitectura. Es la fuente de verdad del sistema.
   Si agregás un módulo, tabla, store, flujo o regla de negocio → reflejalo acá.
2. **`ESTADO-ACTUAL.md`** — handoff para retomar en otra PC: qué está hecho, qué falta,
   cómo levantar el entorno, credenciales/refs. Actualizá la fecha y el estado por módulo.
3. **`PRODUCCION.md`** — tabla de estado de persistencia por módulo (✅ probado / ⬜ pendiente).

Si tocás el esquema de la base, agregá una migración nueva en `supabase/migrations/` (no edites las viejas).

No commitees secretos: `.env.local` y `data-import/` están gitignored (este último tiene PII de menores).

## Arquitectura modo-por-club (no romper)

- **Banfield = real** (Supabase). **Resto = demo** (en memoria, `lib/demo-data.ts`) para mostrar el producto.
- `lib/real-clubs.ts` → `REAL_CLUBS` mapea club demo → club Supabase; `isRealClub(clubId)` es el switch.
- Lectura real: `components/layout/data-provider.tsx` (hidrata + exige sesión).
- Escritura real: stores en `lib/data/*-store.ts`. Patrón en cada handler:
  `if (isRealClub(club.id)) persistAlgo(...)` además del update local.
- RLS multi-tenant: todo dato real exige usuario autenticado miembro del club. Nunca exponer datos con `anon`.

## Reglas de negocio vigentes
- Cuota actividad **$60.000**; pago por **transferencia +10%** (recargo al cobrar, no al billing).
- Descuento hermanos 2º 50% / 3º+ 75%. Vencimiento día 10, mora día 16 (+10%).

## Datos de la nube
- Supabase `banfield-plantel` ref `zdoogaxfuwavdhopemjn` · club id `b1f1e1d0-0000-4000-8000-000000000001`.
- Detalle de setup y credenciales en `ESTADO-ACTUAL.md`.

## Verificación antes de cerrar
- `npx tsc --noEmit` y `npm run build` en verde.
- Si tocaste escritura real, probar el insert contra Supabase con login real (ver scripts de prueba en historial).
