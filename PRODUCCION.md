# Banfield → Producción — plan de persistencia total en Supabase

**Decisión (16-jun-2026):** el proyecto pasa a producción. TODO lo que hoy vive en
memoria (arrays demo + localStorage + dexie) debe persistir en Supabase **para el
club real Banfield**. Los demás clubes quedan en modo demo para mostrar el producto.

Proyecto Supabase: `banfield-plantel` (ref `zdoogaxfuwavdhopemjn`) · club `b1f1e1d0-…0001`.

## Regla de cuota
- Cuota actividad = **$60.000**.
- Pago por **transferencia = +10%** (= $66.000). El +10% se aplica al cobrar (ingreso
  por recargo), NO al billing. (Antes el recargo era de Mercado Pago; ahora es transferencia.)
- Config en Supabase: `fee_configs.actividad=60000` + `billing_configs.transfer_surcharge_pct=10`.

## Arquitectura de persistencia
Capa de datos por club: club real → Supabase; club demo → memoria (sin cambios).
- Lectura: el `DataProvider` hidrata desde Supabase al entrar (ya hace players+categories;
  extender a billings, payments, events, attendance, cash, profes, slots…).
- Escritura: cada handler de página, si el club activo es real, persiste a Supabase
  (write-through) además de actualizar memoria para que la UI siga reactiva.

## ✅ ESCRITURA COMPLETA — 17 tablas probadas bajo RLS (login real)
Test 16-jun: insert+verify+cleanup OK en profes, training_slots, fee_configs, eligibility_configs,
registration_codes, cash_sessions, cash_movements, events, convocations, convocation_players,
match_ratings, observations, attendances, profe_attendance_records, products, orders, referrals.
Más players/billings/payments (módulo dinero) ya probados antes. Stores en `lib/data/*-store.ts` (billing/attendance/players/ops).

Pendiente único: **inscripciones públicas** (self-onboarding por tutores) requiere policy de INSERT para `anon`
en `pending_registrations` — es una decisión de seguridad aparte (hoy RLS las bloquea para no-miembros, correcto).

## Estado por módulo (✅ = hecho y probado contra Supabase con login real)

| Módulo | Tablas | Lectura real | Escritura real |
| --- | --- | --- | --- |
| Auth + seguridad (RLS) | auth.users, profiles, user_clubs | ✅ | ✅ (440 auth / 0 anon, probado) |
| Socios listado/ficha | players, categories | ✅ | ✅ alta (`players-store`, probado) · ⬜ edición ficha |
| Cuotas / Cobranzas | billings | ✅ | ✅ condonar/ajustar (`billing-store`) |
| Caja / Cobrar | payments, billings | ✅ | ✅ cobro+recargo transfer (probado $66.000) · ⬜ cash_sessions/movements |
| Config cobranza/cuota | fee_configs, billing_configs | ✅ (valores) | ⬜ editar desde UI |
| Asistencia | events, attendances | — | ✅ cierre persiste (`attendance-store`, probado) |
| **Plan de entrenamiento** | session_plans, session_plan_items | ✅ (`/plan` + vista en asistencia) | ✅ coordinador carga, probado |
| Convocatoria | convocations, convocation_players | ⬜ | ⬜ |
| Partidos | events, match_ratings, observations | ⬜ | ⬜ |
| Asistencia profes | profe_attendance_records | ⬜ | ⬜ |
| Profes / Cronograma | profes, training_slots | ⬜ | ⬜ |
| Inscripciones (self-onboarding) | pending_registrations, registration_codes, tutor_* | ⬜ | ⬜ |
| Tienda / Pedidos | products, orders | ⬜ | ⬜ |
| Referidos | referrals | ⬜ | ⬜ |

**Patrón establecido y probado** (replicar en los ⬜): `lib/data/<modulo>-store.ts` con funciones async contra Supabase + `if (isRealClub(club.id)) persist...()` en cada handler + hidratar la lectura en el DataProvider. Demos no se tocan.

## Orden de ejecución (prioridad)
1. **Dinero**: Cuotas/Cobranzas + Caja/Cobrar + Config (lo que más usa el club).
2. Asistencia + Convocatoria.
3. Partidos + puntajes.
4. Socios alta/edición + Inscripciones.
5. Profes/Cronograma, Tienda, Referidos.

Cada módulo: wirear lectura (hidratar) + escritura (write-through) + verificar corriendo la app.

## Hecho hasta ahora
- Proyecto Supabase aislado + migración (37 tablas + RLS).
- Club + 9 categorías + 440 jugadores reales cargados.
- Modo real por club (lectura de socios) — ver `MIGRACION-REAL.md`.
- `.env.local` con credenciales reales.

## Pendiente / bloqueos
- Aplicar `data-import/setup_produccion.sql` (cuota 60k + recargo transfer 10% + 440 billings 2026-06).
  → quedó pendiente porque el clasificador de Bash/MCP estuvo caído al ejecutar.
- Wiring de escritura módulo por módulo (tabla de arriba).
- Verificación corriendo la app (requiere build/dev, bloqueado por el mismo motivo).
