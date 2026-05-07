# PRD — Plantel (nombre tentativo)
## Sistema multi-tenant de gestión de clubes deportivos

**Versión:** 1.0
**Fecha:** 2026-05-07
**Stack:** Next.js + TypeScript + Tailwind + shadcn/ui + Supabase + Vercel

---

## 1. Resumen ejecutivo

**Plantel** es un SaaS multi-tenant para clubes deportivos que reemplaza planillas en papel y Excel por un sistema digital integrado. Cubre desde la gestión de socios y plantel hasta la convocatoria a partidos, asistencia a entrenamientos, control de caja y portal de padres.

**Diferencial vs competencia (Lila, GoClub, DigitalClub):**
- Multi-deporte (no solo fútbol) — adaptable a fútbol 11, baby fútbol, futsal, hockey, vóley, básquet
- Integridad financiera de nivel empresa (audit log, no-delete, conciliación bancaria, hash chain)
- Mobile-first real para profes en la cancha
- WhatsApp nativo (no API paga) para convocatorias y recibos
- Portal de padres con flujo aprobación de comprobantes

**Modelo comercial:** Free trial 7 días → Plan Club (operacional) → Plan Pro (federación, contabilidad seria)

**Mercado objetivo:** clubes barriales y filiales con 50-2000 socios, en LATAM (Argentina prioritaria, después Uruguay/Chile/México).

---

## 2. Modelo comercial — 3 planes

### 🆓 Plan Free (Trial 7 días)
- Acceso completo a todas las funcionalidades del Plan Club durante 7 días
- Sin requerimiento de tarjeta de crédito al registrarse
- Después de los 7 días: lectura disponible, escritura bloqueada hasta upgrade
- Email automático en día 5 con CTA a upgrade

### ⚽ Plan Club (operacional — uso diario)
**Precio sugerido:** ARS 35.000 - 50.000/mes (USD 30-45)

**Incluye:**
- 1 club por cuenta
- 1 deporte primario (varios formatos en categorías)
- Hasta 600 socios activos
- Hasta 12 profes
- Gestión de socios completa (alta, ficha, foto, apto médico, posiciones)
- Asistencia mobile-first con permisos por día
- Convocatoria con generador WhatsApp y umbrales dobles
- Fixture y partidos con asistencia, formación básica, tarjetas, comentarios, puntajes 1-10
- Caja diaria (1 cuenta única) con apertura/cierre y conteo
- Pagos multicuota con recibo WhatsApp
- Portal de padres (subir apto y comprobantes)
- Categorías y tiras configurables
- Integridad financiera básica (audit log, no-delete, numeración correlativa, idempotencia)
- Cancha visual estática según deporte/formato

### 🏆 Plan Pro (federación / clubes profesionales)
**Precio sugerido:** ARS 80.000 - 120.000/mes (USD 70-100)

**Suma a Plan Club:**

**Tesorería avanzada**
- Multi-cuenta (caja chica + banco + MercadoPago + USD)
- Estado de resultados jerárquico
- Cobranzas con vencimiento e intereses por mora
- Conciliación bancaria con extractos CSV
- Presupuesto vs real con alertas
- Cash flow proyectado 3 meses
- Cierre de mes inmutable
- Doble validación 4-eyes

**Análisis técnico avanzado**
- Vista de cancha editable (drag & drop)
- Historial de puntajes y evolución por jugador
- Comparativos contra promedio del equipo
- Tarjetas acumuladas y suspensiones automáticas

**Reportería profesional**
- Exportar Excel/PDF (todos los listados)
- Comparativos mes vs mes y año vs año
- Dashboards de tendencias
- Top morosos por antigüedad

**Multi-club / federación**
- Una cuenta gestiona N clubes
- Reportes consolidados a nivel federación
- Switcher entre clubes

**Documentación y compliance**
- Apto médico con vencimiento automático y alertas a 30 días
- Histórico de cambios (auditoría completa)
- Backup mensual automático

**Roles y permisos**
- Roles personalizables (auditor, asistente tesorero, coordinador)
- Permisos granulares por módulo

**Integridad financiera avanzada**
- Hash chain de movimientos (detección de modificaciones históricas)
- Alertas anti-fraude automáticas
- Logs de acceso a info financiera
- Backup diario a bucket separado
- Reportes de auditoría exportables
- Firma digital de cierres de mes (Pro+)

**Multi-deporte por club**
- Club polideportivo (varios deportes en una cuenta)
- Cancha visual editable

**Impresión**
- Recibos de cobro (ticket 80mm o A4)
- Listado de convocados
- Lista de socios por categoría con foto
- Lista de deudores
- Cierre de caja
- Estado de resultados
- Apto médico (constancia)
- Conciliación bancaria
- Templates personalizables con escudo HD

**Integraciones**
- API REST para sistemas contables
- Webhooks
- Importación masiva CSV

**Soporte**
- Soporte priorizado por WhatsApp
- Onboarding personalizado

**Sin límites:** socios, clubes, profes ilimitados.

### Comparativo
| Feature | Free (7d) | Club | Pro |
|---|---|---|---|
| Socios y plantel completo | ✓ | ✓ | ✓ |
| Asistencia con permisos | ✓ | ✓ | ✓ |
| Convocatoria + WhatsApp | ✓ | ✓ | ✓ |
| Fixture y partidos | ✓ | ✓ | ✓ |
| Caja simple (1 cuenta) | ✓ | ✓ | ✓ |
| Cancha visual estática | ✓ | ✓ | ✓ |
| Multi-cuenta financiera | ✓ | ✗ | ✓ |
| Estado de resultados | ✓ | ✗ | ✓ |
| Conciliación bancaria | ✓ | ✗ | ✓ |
| Reportes Excel/PDF | ✓ | ✗ | ✓ |
| Vista cancha editable | ✓ | ✗ | ✓ |
| Multi-club (federación) | ✓ | ✗ | ✓ |
| Multi-deporte | ✓ | ✗ | ✓ |
| Impresión completa | ✓ | ✗ | ✓ |
| Hash chain + audit avanzado | ✓ | ✗ | ✓ |

---

## 3. Arquitectura multi-tenant

**Estrategia:** Single DB + `tenant_id` (club_id) + Row Level Security en todas las tablas de negocio.

**Tablas globales (sin tenant_id):**
- `sports` — catálogo de deportes
- `sport_formats` — formatos por deporte
- `positions` — posiciones por formato
- `field_templates` — SVG de canchas

**Tablas por tenant (todas con `club_id NOT NULL`):**
- Todas las tablas de negocio: players, payments, events, attendance, movements, etc.

**Identificación de tenant:**
- Slug en URL: `app.com/c/<club-slug>/...`
- Sub-dominio opcional para Pro+: `<club>.app.com`

**RLS pattern:**
```sql
CREATE POLICY "club_isolation" ON players FOR ALL
USING (club_id = (SELECT club_id FROM users WHERE id = auth.uid()));
```

**Super-admin global** (rol `super_admin`):
- Ve todos los clubes (para soporte)
- Bypass RLS via `service_role_key`
- Crea nuevas cuentas (planes Pro+)

---

## 4. Catálogo multi-deporte

### Deportes soportados (lanzamiento)

| Sport code | Nombre | Formatos disponibles |
|---|---|---|
| `football_11` | Fútbol 11 | 11v11 estándar |
| `baby_5` | Baby Fútbol 5 | 5v5 con arquero |
| `baby_6` | Baby Fútbol 6 | 6v6 con arquero |
| `futsal` | Futsal (sala) | 5v5 sala |
| `hockey_field` | Hockey césped | 11v11 |
| `volleyball` | Vóley | 6v6 |
| `basketball` | Básquet | 5v5 |
| `rugby` | Rugby infantil | 5v5, 7v7, 10v10 (configurable) |

### Posiciones por formato (catálogo)

**Fútbol 11 (11 jugadores):**
- Arquero (1) · Defensor (4) · Mediocampista (4) · Delantero (2)

**Baby Fútbol 5 (5 jugadores):**
- Arquero (1) · Defensor (1) · Mediocampista (1) · Delantero (1) · Polifuncional (1)

**Baby Fútbol 6 (6 jugadores):**
- Arquero (1) · Defensor (2) · Mediocampista (2) · Delantero (1)

**Futsal (5 jugadores):**
- Arquero · Fijo · Ala derecha · Ala izquierda · Pívot

**Hockey (11 jugadores):**
- Arquera · Defensora central · Defensora lateral · Volante · Delantera

**Vóley (6 jugadores):**
- Zona 1 (saque) · Zona 2 (delantera derecha) · Zona 3 (delantera centro) · Zona 4 (delantera izquierda) · Zona 5 (zaguera izquierda) · Zona 6 (zaguera centro)

**Básquet (5 jugadores):**
- Base (1) · Escolta (2) · Alero (3) · Ala-Pívot (4) · Pívot (5)

### Cancha visual configurable

Cada `sport_format` tiene:
- `field_template_url` — SVG de la cancha (proporción correcta por deporte)
- `field_aspect_ratio` — vertical 2:3 (fútbol), cuadrada (vóley), horizontal 1:2 (hockey)
- Posiciones con coordenadas `default_x, default_y` (% de la cancha)

Componente `<FieldRenderer sportFormatId={id} players={players} />` toma cualquier formato y renderiza la cancha + jugadores correctamente.

---

## 5. Funcionalidades Plan Club (operacional)

### 5.1 Gestión de clubes
- Alta, edición, branding (logo, colores primario/secundario)
- Multi-tenant: cada usuario ve solo el/los club(es) asignados

### 5.2 Socios y plantel
- Listado con buscador (apellido, nombre, DNI, tutor) y filtros acumulativos (deudores + tira + categoría)
- Ficha individual con foto, datos personales, DNI, datos del tutor, posiciones (1 principal + hasta 3 secundarias), apto médico
- Alta multi-hijo (mismo tutor crea N socios en un solo flujo)
- Edición de posiciones triple-tap
- Avatares con foto subida o DiceBear como fallback

### 5.3 Categorías y tiras
- Categorías por año de nacimiento, activas/inactivas
- Tiras configurables (Metro, Liga 1, Liga 2, Edefi en fútbol; equivalentes en otros deportes)
- Cada categoría asignada a un `sport_format`

### 5.4 Profes
- Listado, alta, asignaciones a (categoría × tira)
- Múltiples profes por asignación posible

### 5.5 Asistencia a entrenamientos
- Calendario inteligente con clases del día (live / upcoming / past)
- Tiras agrupadas (Metro+Liga1, Liga2+Edefi en fútbol; configurable por club)
- Toma de lista mobile-first con default "todos presentes"
- Permisos por día de la semana (descontado del divisor del %)
- Visitantes de otra tira y no anotados (con flag para regularización)
- Cierre con firma + reapertura con log
- Estados: Presente / Ausente / Justificado

### 5.6 Convocatoria a partidos
- Slider doble (% mínimo prácticas + % mínimo partidos), modificable por convocatoria
- Filtro por profe (admin ve todas, profe solo las suyas)
- Lista por posición con conteo en vivo
- Excepción para no elegibles
- Generador de mensaje WhatsApp al grupo
- Historial de convocatorias por jugador en su ficha

### 5.7 Fixture y partidos
- Alta de partidos por categoría
- Reprogramación con prompt "reusar última convocatoria"
- Suspender por lluvia
- Pantalla del partido: convocatoria → asistencia pre/post → puntajes 1-10
- Cambios titular ↔ suplente
- Tarjetas amarillas y rojas
- Comentario del partido

### 5.8 Pagos y caja básica
- Registro multicuota desde la ficha del jugador
- Recibo automático por WhatsApp al tutor
- Caja diaria: apertura + movimientos + cierre con conteo
- 1 cuenta única
- Categorías planas de ingresos/egresos
- Configuración de cuotas (actividad, social, matrícula)

### 5.9 Portal de padres
- Login independiente con email del tutor
- Vista de hijos asociados al email
- Subir apto médico (queda en revisión)
- Subir comprobante de transferencia (queda en revisión)
- Histórico de pagos confirmados

### 5.10 Configuración
- Cuotas editables, categorías activas, causales de apercibimiento, umbral global, profes, categorías de caja

### 5.11 Integridad financiera (incluida en Club)
- **Audit log** de todas las acciones financieras
- **No-delete**: anulación con asiento de reverso obligatorio
- **Numeración correlativa** automática
- **Validación obligatoria** al cierre de caja
- **Idempotencia** de cobros (evita duplicados)
- **Roles separados**: profe no toca finanzas
- **Comprobantes inmutables** con hash y timestamp

---

## 6. Funcionalidades Plan Pro (extensión)

### 6.1 Tesorería avanzada

**Multi-cuenta:**
```
accounts:
- id, club_id, name, type (cash | bank | digital_wallet), currency
- opening_balance, current_balance
- bank_name, bank_account_number, alias
```

**Asientos contables (reemplaza/extiende cash_movements):**
```
ledger_entries:
- id, club_id, correlative_number, date, description
- account_from_id, account_to_id (nullable, para transfers internos)
- category_id, amount, currency
- status (pending | confirmed | reconciled | voided)
- payment_id (FK opcional a payments)
- receipt_url, receipt_hash
- created_by, approved_by
- chain_hash, prev_hash (Pro+ hash chain)
```

**Categorías jerárquicas:**
```
finance_category_groups (catálogo):
- id, code, name, type (income_operating | income_other | expense_operating | expense_other | investment)
- display_order

finance_categories:
- id, club_id, group_id, name, is_active
```

**Cobranzas con vencimiento:**
```
billings:
- id, club_id, player_id, period, fee_type
- amount, due_date
- status (pending | paid | overdue)
- paid_at (nullable), payment_id (nullable)
- late_fee_amount (intereses por mora)
```

**Conciliación bancaria:**
```
bank_statements:
- id, account_id, period, file_url, imported_at
- total_debits, total_credits

bank_statement_lines:
- id, statement_id, line_number, date, description, amount
- matched_entry_id (nullable, FK a ledger_entries)
- status (unmatched | matched | suggested | manual_match)
```

**Presupuesto:**
```
budgets:
- id, club_id, category_id, period (YYYY-MM), planned_amount
- (executed_amount calculado on-the-fly)
```

**Cierre de mes:**
```
period_closures:
- id, club_id, period, closed_at, closed_by
- balance_snapshot_json
- signature_hash (Pro+)
- bank_reconciliation_complete (boolean)
```

### 6.2 Análisis técnico avanzado

**Estadísticas históricas:**
```
player_match_stats (computed view):
- player_id, match_id
- played_minutes, position_played
- score (1-10), goals, yellow_cards, red_cards
- comments
```

**Vistas:**
- Evolución del puntaje del jugador (línea temporal)
- Promedio del jugador vs promedio del equipo
- Tarjetas acumuladas y proyección de suspensión

### 6.3 Reportes Pro

Cada reporte tiene:
- Ruta `/reportes/<tipo>` con filtros (fecha, categoría, profe, etc.)
- Vista en pantalla con gráficos (Recharts o equivalente)
- Botón "Exportar Excel" → genera XLSX con SheetJS
- Botón "Exportar PDF" → genera PDF con react-pdf o html2pdf

**Reportes incluidos:**
- Estado de resultados mensual/anual
- Top deudores por antigüedad
- Recaudación mes vs mes año anterior
- Asistencia consolidada por categoría
- Cobranzas pendientes
- Movimientos por cuenta
- Conciliación bancaria
- Auditoría (logs filtrados por usuario/módulo/período)

### 6.4 Sistema de impresión Pro

**Rutas `/imprimir/<documento>`:**
- `/imprimir/recibo/[paymentId]` — ticket 80mm o A4
- `/imprimir/convocatoria/[matchId]` — A4 vertical
- `/imprimir/listado-socios?cat=X` — A4 horizontal
- `/imprimir/deudores` — A4 con monto y antigüedad
- `/imprimir/cierre-caja/[sessionId]` — ticket 80mm
- `/imprimir/estado-resultados?period=YYYY-MM` — A4 multipágina
- `/imprimir/apto-medico/[playerId]` — A4 constancia
- `/imprimir/conciliacion/[reconciliationId]` — A4

**Cada ruta:**
- Layout específico con `@media print`
- Encabezado con escudo + nombre + fecha
- Pie con paginación + datos del club (CUIT, dirección, etc. configurables)
- Botón flotante "Imprimir" que invoca `window.print()`
- Detección automática de tipo (ticket vs A4) según `?size=ticket|a4`

### 6.5 Integridad financiera avanzada

**Hash chain:**
- Cada `ledger_entry` tiene `chain_hash` calculado al insertar:
  `hash(prev_hash + entry_id + amount + account_id + date + created_by)`
- Validación periódica: si la cadena no se reproduce, alerta de manipulación

**Alertas anti-fraude:**
```
fraud_alerts:
- id, club_id, type (anomaly | suspicious_time | duplicate | inactive_user | high_amount)
- severity (low | medium | high)
- related_entity_id, message, status
```

**Logs de acceso:**
```
access_logs:
- id, club_id, user_id, module, accessed_at, ip, user_agent
```

**Doble validación (4-eyes):**
```
approvals:
- id, entry_id, requested_by, approved_by, approved_at, status
- amount_threshold (a partir de cuánto requiere aprobación)
```

### 6.6 Multi-club / federación
- Tabla `user_clubs` (relación N:N) en lugar de `users.club_id`
- Switcher de club en el header
- Reportes consolidados con `WHERE club_id IN (mis_clubes)`

### 6.7 Documentación y compliance
- Apto médico con `expires_at` + cron diario que envía alertas 30 días antes
- Histórico de cambios en `audit_log` con before/after JSON

---

## 7. Modelo de datos completo

### 7.1 Tablas globales (sin club_id)

```sql
-- Catálogo de deportes
CREATE TABLE sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  icon text,
  is_active boolean DEFAULT true
);

-- Formatos de cada deporte (ej: Fútbol 11, Baby 5)
CREATE TABLE sport_formats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id uuid REFERENCES sports(id),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  players_on_field int NOT NULL,
  has_goalkeeper boolean DEFAULT true,
  max_substitutes int DEFAULT 5,
  match_duration_min int,
  has_yellow_red_cards boolean DEFAULT true,
  scoring_system text DEFAULT 'goals',
  field_aspect_ratio text DEFAULT '2:3',
  field_template_url text
);

-- Posiciones de cada formato
CREATE TABLE positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_format_id uuid REFERENCES sport_formats(id),
  code text NOT NULL,
  label text NOT NULL,
  display_order int,
  default_x numeric,
  default_y numeric,
  color_hex text,
  UNIQUE (sport_format_id, code)
);

-- Categorías de gastos jerárquicas (catálogo recomendado)
CREATE TABLE finance_category_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income_operating', 'income_other', 'expense_operating', 'expense_other', 'investment')),
  display_order int
);

-- Planes
CREATE TABLE plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  monthly_price_ars numeric,
  monthly_price_usd numeric,
  max_socios int,
  max_clubs int,
  features_json jsonb
);
```

### 7.2 Tablas por tenant (todas con club_id)

```sql
-- Clubes (raíz de tenancy)
CREATE TABLE clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#00843D',
  secondary_color text DEFAULT '#C9A84C',
  city text,
  country text DEFAULT 'AR',
  default_sport_id uuid REFERENCES sports(id),
  plan_id uuid REFERENCES plans(id),
  trial_ends_at timestamptz,
  is_active boolean DEFAULT true,
  cuit text,
  address text,
  print_footer text,
  created_at timestamptz DEFAULT now()
);

-- Usuarios (extiende auth.users con datos propios + club)
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text,
  role text NOT NULL CHECK (role IN ('super_admin','admin','profe','tesorero','padre')),
  is_active boolean DEFAULT true
);

-- Relación N:N usuario-club (Pro permite varios clubes; Club: 1)
CREATE TABLE user_clubs (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, club_id)
);

-- Categorías por club (con su sport_format)
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  birth_year int,
  sport_format_id uuid REFERENCES sport_formats(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tiras por club (Metro, Liga 1, etc. configurables por club)
CREATE TABLE tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  color_hex text,
  display_order int,
  is_active boolean DEFAULT true
);

-- Profes
CREATE TABLE profes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  full_name text NOT NULL,
  whatsapp text,
  is_active boolean DEFAULT true
);

-- Asignaciones profe → (categoría × tira)
CREATE TABLE profe_assignments (
  profe_id uuid REFERENCES profes(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  tier_id uuid REFERENCES tiers(id) ON DELETE CASCADE,
  PRIMARY KEY (profe_id, category_id, tier_id)
);

-- Jugadores
CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  dni text,
  birth_date date,
  category_id uuid REFERENCES categories(id),
  tier_id uuid REFERENCES tiers(id),
  primary_position_id uuid REFERENCES positions(id),
  secondary_position_ids uuid[] DEFAULT '{}',
  photo_url text,
  tutor_name text,
  tutor_dni text,
  tutor_email text,
  tutor_whatsapp text,
  apto_medico_ok boolean DEFAULT false,
  apto_medico_file_url text,
  apto_medico_expires_at date,
  is_active boolean DEFAULT true,
  convocation_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Permisos de ausencia por día
CREATE TABLE attendance_permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  weekday int CHECK (weekday BETWEEN 1 AND 7),
  reason text,
  approved_by uuid REFERENCES profes(id),
  active_from date,
  active_to date
);

-- Eventos (prácticas y partidos)
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id),
  event_type text CHECK (event_type IN ('practice','match')),
  scheduled_at timestamptz NOT NULL,
  is_suspended boolean DEFAULT false,
  suspension_reason text,
  rival text,
  venue text,
  is_home boolean,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Asistencia
CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  status text CHECK (status IN ('present','absent_justified','absent_unjustified')),
  justified_reason text,
  registered_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (event_id, player_id)
);

-- Convocatorias
CREATE TABLE convocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id),
  practice_threshold int,
  match_threshold int,
  whatsapp_message text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE convocation_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convocation_id uuid REFERENCES convocations(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id),
  is_starter boolean DEFAULT false,
  is_exception boolean DEFAULT false,
  position_in_field text
);

-- Cuentas (Pro: multi-cuenta. Club: 1 cuenta única)
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text CHECK (type IN ('cash','bank','digital_wallet')),
  currency text DEFAULT 'ARS',
  opening_balance numeric DEFAULT 0,
  bank_name text,
  bank_account_number text,
  is_active boolean DEFAULT true
);

-- Categorías financieras por club
CREATE TABLE finance_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  group_id uuid REFERENCES finance_category_groups(id),
  name text NOT NULL,
  movement_type text CHECK (movement_type IN ('income','expense','both')),
  is_active boolean DEFAULT true
);

-- Asientos (reemplaza cash_movements anterior)
CREATE TABLE ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  correlative_number int NOT NULL,
  date date NOT NULL,
  description text,
  account_from_id uuid REFERENCES accounts(id),
  account_to_id uuid REFERENCES accounts(id),
  category_id uuid REFERENCES finance_categories(id),
  amount numeric NOT NULL,
  currency text DEFAULT 'ARS',
  status text DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','reconciled','voided')),
  payment_id uuid,
  receipt_url text,
  receipt_hash text,
  voided_at timestamptz,
  voided_by uuid REFERENCES users(id),
  void_reason text,
  reverses_entry_id uuid REFERENCES ledger_entries(id),
  chain_hash text,
  prev_hash text,
  created_by uuid REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (club_id, correlative_number)
);

-- Pagos (factura/cobranza emitida)
CREATE TABLE billings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id),
  fee_type text,
  period text,
  amount numeric NOT NULL,
  due_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
  paid_at date,
  ledger_entry_id uuid REFERENCES ledger_entries(id),
  late_fee_amount numeric DEFAULT 0
);

-- Cierre de caja diaria (para Plan Club mantiene compatibilidad)
CREATE TABLE cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id),
  date date NOT NULL,
  opening_amount numeric NOT NULL,
  closing_amount numeric,
  counted_amount numeric,
  difference_amount numeric,
  difference_explanation text,
  opened_by uuid REFERENCES users(id),
  closed_by uuid REFERENCES users(id),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Cierres de mes (Pro)
CREATE TABLE period_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  period text NOT NULL,
  closed_at timestamptz,
  closed_by uuid REFERENCES users(id),
  balance_snapshot_json jsonb,
  signature_hash text,
  bank_reconciliation_complete boolean DEFAULT false,
  UNIQUE (club_id, period)
);

-- Conciliación bancaria (Pro)
CREATE TABLE bank_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id),
  period text,
  file_url text,
  imported_at timestamptz DEFAULT now()
);

CREATE TABLE bank_statement_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  statement_id uuid REFERENCES bank_statements(id) ON DELETE CASCADE,
  line_number int,
  date date,
  description text,
  amount numeric,
  matched_entry_id uuid REFERENCES ledger_entries(id),
  status text DEFAULT 'unmatched' CHECK (status IN ('unmatched','matched','suggested','manual_match'))
);

-- Presupuesto (Pro)
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  category_id uuid REFERENCES finance_categories(id),
  period text,
  planned_amount numeric NOT NULL
);

-- Audit log (Plan Club incluido, Pro extendido)
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  ip text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Logs de acceso (Pro)
CREATE TABLE access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  module text,
  accessed_at timestamptz DEFAULT now(),
  ip text,
  user_agent text
);

-- Alertas anti-fraude (Pro)
CREATE TABLE fraud_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  type text NOT NULL,
  severity text CHECK (severity IN ('low','medium','high')),
  related_entity text,
  related_entity_id uuid,
  message text,
  status text DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed')),
  created_at timestamptz DEFAULT now()
);

-- Aprobaciones 4-eyes (Pro)
CREATE TABLE approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  entity text NOT NULL,
  entity_id uuid NOT NULL,
  requested_by uuid REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected'))
);
```

### 7.3 RLS policies (todas las tablas con club_id)

```sql
-- Función helper
CREATE OR REPLACE FUNCTION current_user_clubs() RETURNS uuid[] AS $$
  SELECT array_agg(club_id) FROM user_clubs WHERE user_id = auth.uid();
$$ LANGUAGE SQL STABLE;

-- Aplicado a cada tabla con club_id
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY club_isolation ON players FOR ALL
USING (club_id = ANY(current_user_clubs()));

-- Repetir para todas las tablas con club_id...
```

### 7.4 Triggers de integridad

```sql
-- Numeración correlativa automática
CREATE OR REPLACE FUNCTION assign_correlative_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(correlative_number), 0) + 1
  INTO NEW.correlative_number
  FROM ledger_entries
  WHERE club_id = NEW.club_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_correlative
BEFORE INSERT ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION assign_correlative_number();

-- Hash chain (Pro)
CREATE OR REPLACE FUNCTION compute_chain_hash()
RETURNS TRIGGER AS $$
BEGIN
  SELECT chain_hash INTO NEW.prev_hash
  FROM ledger_entries
  WHERE club_id = NEW.club_id
  ORDER BY correlative_number DESC
  LIMIT 1;

  NEW.chain_hash := encode(
    digest(
      COALESCE(NEW.prev_hash, '') || NEW.id::text || NEW.amount::text ||
      NEW.account_from_id::text || NEW.date::text || NEW.created_by::text,
      'sha256'
    ), 'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hash_chain
BEFORE INSERT ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION compute_chain_hash();

-- Auto-audit log
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (club_id, user_id, action, entity, entity_id, before_json, after_json)
  VALUES (
    COALESCE(NEW.club_id, OLD.club_id),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE TG_OP WHEN 'DELETE' THEN row_to_json(OLD) WHEN 'UPDATE' THEN row_to_json(OLD) END,
    CASE TG_OP WHEN 'INSERT' THEN row_to_json(NEW) WHEN 'UPDATE' THEN row_to_json(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas críticas: ledger_entries, players, payments, billings, etc.
```

---

## 8. Costos de infra

| Plan | Tenants soportados | Vercel | Supabase | Total/mes | Margen objetivo |
|---|---|---|---|---|---|
| Free trial | N/A | Pro USD 20 (compartido) | Free | USD 20 fijo | — |
| Plan Club (USD 35) | 1 | — | — (compartido) | USD 1-2 | 95% |
| Plan Pro (USD 80) | 1 | — | — (compartido) | USD 3-5 | 94% |

**A 50 clientes Club + 10 Pro:** USD 2.550 ingresos, USD 100 costos, **USD 2.450 margen mensual**.

**Escala crítica:**
- Hasta 30 tenants: Supabase Free + Vercel Pro
- 30-100 tenants: Supabase Pro USD 25/mes
- 100+ tenants: posible split a múltiples instancias o sharding

---

## 9. Roadmap de implementación

### Sprint 1 (1 semana) — Refactor multi-tenant del demo actual
- Tabla `clubs` real en Supabase
- `club_id` en todas las tablas existentes
- RLS por club
- Onboarding de nuevo club

### Sprint 2 (1 semana) — Catálogo multi-deporte
- Tablas `sports`, `sport_formats`, `positions`
- Selector de deporte al crear club
- Selector de formato por categoría
- `<FieldRenderer>` configurable

### Sprint 3 (1.5 semanas) — Tesorería Pro
- Multi-cuenta
- `ledger_entries` con correlativo y hash chain
- Estado de resultados jerárquico
- Cobranzas con vencimiento
- Cierre de mes

### Sprint 4 (1 semana) — Reportes y exportación
- Páginas de reportes con filtros
- Exportar Excel/PDF
- Comparativos histórico

### Sprint 5 (1 semana) — Sistema de impresión
- Rutas `/imprimir/*`
- 8 templates con CSS print
- Configuración de tamaños

### Sprint 6 (1 semana) — Conciliación bancaria
- Importar CSV
- Matching automático
- UI de marcado manual

### Sprint 7 (1 semana) — Compliance y portal padres mejorado
- Apto médico con cron de alertas
- Approvals 4-eyes
- Hash chain validation periódica

### Sprint 8 (1 semana) — Multi-club y federación
- `user_clubs` N:N
- Switcher robusto
- Reportes consolidados

**Total estimado:** 8.5 semanas de desarrollo (~2 meses con tiempo de testing).

---

## 10. Métricas de éxito

**Producto:**
- Tiempo de onboarding del primer club: <30 min
- % de clubes que renuevan suscripción mes 2: >80%
- NPS al mes 3: >40
- Tickets de soporte por cliente activo: <2/mes

**Comercial:**
- Conversión Free → Club: >25% al día 7
- Conversión Club → Pro: >15% al mes 6
- Churn mensual: <5%

**Técnico:**
- Uptime: >99.5%
- p95 de respuesta: <500ms
- Errores en producción: <1 por 1000 requests
- Cobertura de tests en módulo financiero: 100%

---

## Anexo A — Identidad y branding del producto

**Nombre tentativo:** Plantel
- En español funciona universal (plantel del club, plantel docente, etc.)
- En portugués: equivalente "elenco" pero "Plantel" se entiende
- En inglés: "Squad" o "Roster" — habrá que decidir nombre internacional cuando llegue ese mercado

**Tagline:** *"El sistema que reemplaza las planillas. Para clubes que se toman en serio el deporte."*

**Posicionamiento:** somos el único sistema con:
1. Multi-deporte real (no solo fútbol)
2. Integridad financiera nivel empresa
3. WhatsApp nativo sin API paga
4. Mobile-first real para profes en el campo

---

**Fin del documento.**
