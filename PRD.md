# PRD — BanfieldRM

---

## Rol del asistente

Eres un desarrollador de software experto en Next.js, TypeScript, Tailwind CSS, shadcn/ui, Supabase y Vercel. Nos vas a ayudar a construir una aplicación web llamada **BanfieldRM**.

---

## Descripción General

**BanfieldRM** es una aplicación web de administración interna dirigida al equipo de gestión de la Filial Banfield Ramos Mejía (Club Atlético Banfield) que permite administrar socios, pagos, jugadores por categoría, asistencia a prácticas y partidos, convocatorias y finanzas del club. El objetivo del producto es reemplazar el uso de planillas en papel y Excel por un sistema digital centralizado, accesible desde cualquier dispositivo, que opere también sin conexión a internet cuando los profes están en la cancha.

---

## Objetivos y Visión del Producto

La filial actualmente administra socios, cobros de cuotas, jugadores y asistencia con planillas físicas y hojas de cálculo. El sistema digital debe centralizar toda esa información, eliminar errores de registro manual, y darle a cada rol (administrador, profe, tesorero) las herramientas exactas que necesita para operar con eficiencia. La visión a mediano plazo es que cualquier decisión operativa del club — desde saber quién debe cuota hasta quién puede ser convocado para el partido del sábado — se pueda tomar desde la app en segundos.

---

## Usuarios Objetivo y Roles

La aplicación es de uso exclusivo interno del club. No está abierta a padres ni a jugadores en esta versión.

**Roles de usuario:**

- **Administrador**: acceso completo. Gestiona socios, jugadores, cuotas, categorías activas, causales de apercibimiento, usuarios del sistema y toda la configuración general.
- **Profe / Entrenador**: accede únicamente a su(s) categoría(s) asignada(s). Puede tomar asistencia en prácticas y partidos, registrar observaciones sobre jugadores, armar y publicar convocatorias, gestionar el fixture de su categoría.
- **Tesorero**: accede al módulo de caja y finanzas. Puede registrar aperturas y cierres de caja, movimientos de ingresos y egresos, imputar gastos a categorías, y consultar el listado de deudores.

---

## Funcionalidades Clave

### 1. Gestión de socios y jugadores

1.1. Alta, baja y modificación de socios/jugadores con foto (capturada desde cámara o subida desde galería).

1.2. Ficha del jugador con: nombre y apellido, fecha de nacimiento, año de categoría, turno (mañana / tarde), foto de perfil, nombre y apellido del tutor, WhatsApp del tutor, estado de cuota, historial de asistencia, historial de convocatorias, observaciones registradas.

1.3. Organización por categoría (año de nacimiento) y turno. Las categorías se crean y activan/desactivan desde el panel de configuración del administrador. Solo las categorías marcadas como activas aparecen en el sistema operativo.

1.4. Contador visible en la ficha de cuántas veces fue convocado el jugador durante la temporada.

### 2. Gestión de cuotas y pagos

2.1. Tres tipos de cuota configurables desde el admin: **cuota de actividad** (mensual), **cuota social** (mensual), **matrícula** (pago único anual). Los montos se actualizan cuando el admin los modifica.

2.2. Registro de cada pago indicando: socio, tipo de cuota, período, monto, fecha, medio de pago (efectivo o transferencia bancaria). Si el pago es por transferencia, se permite adjuntar o registrar el número/referencia del comprobante.

2.3. El estado de cuota del socio tiene tres valores: **Al día** (verde) / **Próximo a vencer** (amarillo) / **Deudor** (rojo). Visible como badge en la lista y en la ficha.

2.4. Listado de deudores filtrable por categoría, con monto adeudado. Desde cada fila, botón que abre WhatsApp con texto pre-armado dirigido al tutor: *"Hola [nombre del tutor], te recordamos que [nombre del niño] tiene una deuda pendiente de $[monto] en el Club Banfield Ramos Mejía. Cualquier consulta estamos a disposición."*

### 3. Asistencia

3.1. La asistencia se registra tanto en prácticas como en partidos. El profe accede a la lista de su categoría/turno, que carga con todos los jugadores marcados como **presentes por defecto**. El profe solo toca a los que faltaron para cambiar su estado.

3.2. Estados de asistencia por jugador por evento: **Presente** / **Ausente justificado** (con motivo, ej: colegio — descontado del divisor del %) / **Ausente injustificado**.

3.3. Cuando se crea un evento de práctica, el profe puede marcarlo como **suspendido** (ej: lluvia). Los días suspendidos no cuentan en el divisor del cálculo de asistencia.

3.4. Fórmula de porcentaje de asistencia:
```
% asistencia = asistencias efectivas / (total de prácticas − prácticas suspendidas − ausencias autorizadas por el técnico)
```

3.5. El porcentaje y el contador de asistencias son visibles en la ficha del jugador y en la pantalla de selección de convocatoria.

### 4. Observaciones en eventos

4.1. En cada práctica o partido, el profe puede registrar observaciones individuales sobre cualquier jugador. Tipos de observación:

- **Jugador destacado**: nota positiva sobre desempeño.
- **Llamado de atención**: advertencia informal.
- **Apercibimiento**: sanción formal. Requiere seleccionar una causal del listado configurable por el admin (ej: mala conducta, falta de respeto, indisciplina táctica). Las causales se pre-cargan al instalar el sistema con un set estándar para fútbol infantil de club barrial.

4.2. Las observaciones quedan registradas en la ficha del jugador con fecha, tipo, evento y texto libre opcional.

### 5. Elegibilidad y convocatoria

5.1. El umbral de elegibilidad (porcentaje mínimo de asistencia para poder ser convocado) se configura globalmente desde el admin y puede modificarse. Por ejemplo: 50%.

5.2. En la pantalla de armado de convocatoria, los jugadores elegibles aparecen en la sección superior activos y seleccionables. Los jugadores que no alcanzan el umbral aparecen en la sección inferior **en gris**, con el texto "No elegible — le faltan N prácticas" o el porcentaje actual. El profe puede, como excepción, seleccionar a un jugador no elegible; el sistema lo marca visualmente como **"Convocado por excepción"** para que quede registrado.

5.3. La convocatoria se arma sobre una vista de cancha de fútbol (campo verde visto desde arriba) donde el profe posiciona a los jugadores con sus fotos de perfil en las posiciones del equipo.

5.4. Al confirmar la convocatoria, el sistema genera un texto formateado listo para enviar al grupo de WhatsApp del equipo. El botón "Abrir en WhatsApp" usa el deep link `wa.me` para abrir la app directamente con el mensaje pre-cargado. Formato del mensaje:

```
⚽ CONVOCATORIA — [Categoría] — [Nombre del rival]
📅 [Día y fecha] — [Hora]
📍 [Lugar]

Jugadores convocados:
1. [Nombre]
2. [Nombre]
...

Presentarse [X] minutos antes.
¡Vamos Banfield! 💚
```

5.5. La convocatoria queda guardada en el historial del partido. Cada jugador convocado suma +1 a su contador de convocatorias en la ficha.

### 6. Fixture

6.1. El profe o admin puede crear el fixture de cada categoría con partidos (rival, fecha tentativa, hora, sede — local o visitante).

6.2. Las fechas son tentativas y pueden modificarse. Cuando un partido se reprograma, el sistema pregunta: **"¿Usar la última convocatoria guardada o armar una nueva?"**

6.3. El fixture es visible como calendario por categoría.

### 7. Control de caja y finanzas

7.1. **Apertura de caja**: el tesorero registra el monto inicial del día.

7.2. **Movimientos de caja**: registro de ingresos (ej: cobro de cuotas, donaciones) y egresos (ej: compra de materiales, alquiler de cancha) durante el día, cada uno con: monto, tipo (ingreso/egreso), categoría de imputación, descripción libre, medio (efectivo / transferencia).

7.3. **Categorías de gasto/ingreso**: pre-cargadas al instalar con categorías típicas de un club de fútbol barrial (ej: Alquiler de cancha, Materiales deportivos, Arbitraje, Mantenimiento, Cuotas cobradas, Donaciones, Otros). Configurables desde el admin.

7.4. **Cierre de caja**: el tesorero registra el monto final. El sistema muestra el resumen del día: saldo inicial + ingresos − egresos = saldo final esperado vs. saldo contado.

7.5. **Dashboard financiero**: recaudación del mes, egresos del mes, saldo actual, gráfico de dona con % recaudado vs. presupuestado.

### 8. Dashboard

8.1. Vista principal con KPIs en cards coloridas al estilo del diseño de referencia:
- Socios activos
- Recaudación del mes (con gráfico de dona)
- Cantidad de deudores (card en rojo si hay deudores)
- Próximo partido (categoría, rival, fecha)
- Último cierre de caja

8.2. Accesos rápidos a las acciones más frecuentes: Tomar asistencia, Nueva convocatoria, Registrar pago, Abrir caja.

---

## Pantallas / Páginas y Flujos

**Pantallas principales:**

- `/login` — autenticación
- `/dashboard` — panel principal con KPIs y accesos rápidos
- `/socios` — listado de socios con filtros (estado de cuota, categoría, deudores)
- `/socios/[id]` — ficha completa del socio/jugador
- `/socios/nuevo` — alta de socio
- `/asistencia` — selección de evento para tomar lista
- `/asistencia/[eventoId]` — toma de asistencia con lista de jugadores
- `/convocatoria` — selección de partido y armado del plantel
- `/convocatoria/[partidoId]` — vista de cancha y generación del mensaje WhatsApp
- `/fixture` — calendario de partidos por categoría
- `/fixture/[partidoId]` — detalle y edición de un partido
- `/caja` — apertura, movimientos y cierre de caja del día
- `/finanzas` — historial de movimientos e ingresos/egresos
- `/config` — panel de administración: cuotas, categorías activas, causales de apercibimiento, usuarios del sistema, categorías de caja

**Flujo del Administrador:**
Entra al dashboard → ve KPIs → gestiona socios desde `/socios` → registra pagos desde la ficha → consulta deudores → configura categorías y cuotas desde `/config`.

**Flujo del Profe:**
Entra al dashboard → va a `/asistencia` → selecciona su categoría y el evento del día → toma lista (todos presentes por defecto, marca ausentes) → registra observaciones → al llegar el fin de semana, va a `/convocatoria` → selecciona el partido del fixture → ve la lista de elegibles → arma el plantel en la cancha → genera el mensaje WhatsApp.

**Flujo del Tesorero:**
Entra al dashboard → va a `/caja` → registra apertura → durante el día registra movimientos → al final del día registra el cierre → consulta `/finanzas` para reportes del mes.

---

## Requisitos Técnicos

**Frontend:**
La aplicación se construirá con Next.js (App Router) y TypeScript, utilizando Tailwind CSS y shadcn/ui para estilos responsivos y componentes consistentes. Será una **Progressive Web App (PWA)** con soporte offline mediante service workers. La toma de asistencia funcionará sin conexión utilizando **IndexedDB** para persistir datos localmente y sincronizar automáticamente al recuperar la conexión. La interfaz es **mobile-first** — especialmente las pantallas de asistencia y convocatoria — y también estará bien diseñada para uso en desktop por el administrador.

**Backend y Base de datos:**
Se usará **Supabase** (PostgreSQL) para la base de datos, autenticación de usuarios y almacenamiento de archivos. Las fotos de jugadores se almacenan en **Supabase Storage**. Se habilitará Row Level Security (RLS) en todas las tablas.

**Integraciones / API externas:**
- **WhatsApp deep link** (`wa.me`): para envío de convocatorias y mensajes de deuda. No requiere API ni integración especial — el sistema genera el texto y abre la app de WhatsApp con el mensaje pre-cargado. Sin costo adicional.

**Otras tecnologías:**
- **next-pwa** o **Serwist**: para el service worker y capacidades PWA offline.
- **idb** o **Dexie.js**: para gestión de IndexedDB en la capa de sincronización offline.
- **next/image**: para optimización de fotos de jugadores.

**Deploy / Hosting:**
Por defecto se desplegará en Vercel, conectado al repositorio de GitHub. Cada push a `main` dispara un redeploy automático.

**Variables de entorno necesarias:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## Modelo de Datos (Supabase / Postgres)

### Tabla `users`
- `id`: uuid (PK, auth.users)
- `email`: text
- `full_name`: text
- `role`: text — enum: `admin` | `profe` | `tesorero`
- `created_at`: timestamptz (auto)

### Tabla `categories`
- `id`: uuid (PK)
- `name`: text — ej: "2012", "2013", "Sub-11"
- `birth_year`: integer
- `is_active`: boolean — solo las activas aparecen en el sistema
- `created_at`: timestamptz

### Tabla `profe_categories`
- `profe_id`: uuid → users.id
- `category_id`: uuid → categories.id
- PK compuesta: `[profe_id, category_id]`

### Tabla `players`
- `id`: uuid (PK)
- `full_name`: text
- `birth_date`: date
- `category_id`: uuid → categories.id
- `shift`: text — enum: `morning` | `afternoon`
- `photo_url`: text (Supabase Storage)
- `tutor_name`: text
- `tutor_whatsapp`: text
- `is_active`: boolean
- `convocation_count`: integer (default 0)
- `created_at`: timestamptz

### Tabla `fee_config`
- `id`: uuid (PK)
- `fee_type`: text — enum: `actividad` | `social` | `matricula`
- `amount`: numeric
- `updated_at`: timestamptz
- `updated_by`: uuid → users.id

### Tabla `payments`
- `id`: uuid (PK)
- `player_id`: uuid → players.id
- `fee_type`: text — enum: `actividad` | `social` | `matricula`
- `period`: text — ej: "2025-05" para mensual, "2025" para matrícula
- `amount`: numeric
- `paid_at`: date
- `payment_method`: text — enum: `cash` | `transfer`
- `transfer_reference`: text (nullable — solo si es transferencia)
- `registered_by`: uuid → users.id
- `created_at`: timestamptz

### Tabla `events`
- `id`: uuid (PK)
- `category_id`: uuid → categories.id
- `event_type`: text — enum: `practice` | `match`
- `scheduled_at`: timestamptz
- `is_suspended`: boolean (default false)
- `suspension_reason`: text (nullable)
- `rival`: text (nullable — solo partidos)
- `venue`: text (nullable)
- `is_home`: boolean (nullable)
- `created_by`: uuid → users.id
- `created_at`: timestamptz

### Tabla `attendance`
- `id`: uuid (PK)
- `event_id`: uuid → events.id
- `player_id`: uuid → players.id
- `status`: text — enum: `present` | `absent_justified` | `absent_unjustified`
- `justified_reason`: text (nullable)
- `registered_by`: uuid → users.id
- `created_at`: timestamptz
- UNIQUE: `[event_id, player_id]`

### Tabla `observations`
- `id`: uuid (PK)
- `event_id`: uuid → events.id
- `player_id`: uuid → players.id
- `observation_type`: text — enum: `highlight` | `warning` | `sanction`
- `sanction_cause_id`: uuid → sanction_causes.id (nullable)
- `notes`: text
- `registered_by`: uuid → users.id
- `created_at`: timestamptz

### Tabla `sanction_causes`
- `id`: uuid (PK)
- `name`: text — ej: "Mala conducta", "Falta de respeto", "Indisciplina táctica"
- `is_active`: boolean
- `created_at`: timestamptz

### Tabla `convocations`
- `id`: uuid (PK)
- `event_id`: uuid → events.id (partido)
- `created_by`: uuid → users.id
- `is_reused`: boolean — indica si se reutilizó la convocatoria de un partido anterior
- `whatsapp_message`: text — texto generado para WhatsApp
- `created_at`: timestamptz

### Tabla `convocation_players`
- `id`: uuid (PK)
- `convocation_id`: uuid → convocations.id
- `player_id`: uuid → players.id
- `position`: text (nullable — posición en la cancha)
- `is_exception`: boolean — convocado por excepción sin cumplir el umbral
- `created_at`: timestamptz

### Tabla `cash_sessions`
- `id`: uuid (PK)
- `date`: date
- `opening_amount`: numeric
- `closing_amount`: numeric (nullable — null hasta el cierre)
- `opened_by`: uuid → users.id
- `closed_by`: uuid → users.id (nullable)
- `created_at`: timestamptz

### Tabla `cash_movements`
- `id`: uuid (PK)
- `session_id`: uuid → cash_sessions.id
- `movement_type`: text — enum: `income` | `expense`
- `amount`: numeric
- `finance_category_id`: uuid → finance_categories.id
- `description`: text
- `payment_method`: text — enum: `cash` | `transfer`
- `transfer_reference`: text (nullable)
- `registered_by`: uuid → users.id
- `created_at`: timestamptz

### Tabla `finance_categories`
- `id`: uuid (PK)
- `name`: text — ej: "Alquiler de cancha", "Materiales deportivos", "Arbitraje"
- `movement_type`: text — enum: `income` | `expense` | `both`
- `is_active`: boolean
- `created_at`: timestamptz

### Tabla `eligibility_config`
- `id`: uuid (PK)
- `min_attendance_percentage`: integer — ej: 50
- `updated_at`: timestamptz
- `updated_by`: uuid → users.id

---

### Relaciones clave:
- `players.category_id` → `categories.id`
- `attendance.event_id` → `events.id`
- `attendance.player_id` → `players.id`
- `convocation_players.convocation_id` → `convocations.id`
- `convocation_players.player_id` → `players.id`
- `cash_movements.session_id` → `cash_sessions.id`
- `observations.sanction_cause_id` → `sanction_causes.id`

---

### Row Level Security:
- `players`: admin lee y escribe todo; profe lee solo los de su categoría; tesorero no accede.
- `attendance`: admin lee y escribe todo; profe lee y escribe solo su categoría.
- `payments`: admin y tesorero leen y escriben; profe no accede.
- `cash_sessions` y `cash_movements`: admin y tesorero leen y escriben; profe no accede.
- `convocations` y `convocation_players`: admin lee todo; profe escribe solo su categoría.
- `categories`, `fee_config`, `eligibility_config`, `sanction_causes`, `finance_categories`: solo admin escribe; otros roles solo leen las que necesitan.

---

### Schema SQL completo:

```sql
-- Extensión UUID
create extension if not exists "pgcrypto";

-- Categorías
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_year integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Usuarios del sistema (extendido de auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'profe', 'tesorero')),
  created_at timestamptz not null default now()
);

-- Relación profe → categorías asignadas
create table profe_categories (
  profe_id uuid references users(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (profe_id, category_id)
);

-- Jugadores
create table players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  birth_date date not null,
  category_id uuid references categories(id),
  shift text not null check (shift in ('morning', 'afternoon')),
  photo_url text,
  tutor_name text,
  tutor_whatsapp text,
  is_active boolean not null default true,
  convocation_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Configuración de cuotas
create table fee_config (
  id uuid primary key default gen_random_uuid(),
  fee_type text not null check (fee_type in ('actividad', 'social', 'matricula')),
  amount numeric not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references users(id)
);

-- Pagos
create table payments (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  fee_type text not null check (fee_type in ('actividad', 'social', 'matricula')),
  period text not null,
  amount numeric not null,
  paid_at date not null,
  payment_method text not null check (payment_method in ('cash', 'transfer')),
  transfer_reference text,
  registered_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- Eventos (prácticas y partidos)
create table events (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  event_type text not null check (event_type in ('practice', 'match')),
  scheduled_at timestamptz not null,
  is_suspended boolean not null default false,
  suspension_reason text,
  rival text,
  venue text,
  is_home boolean,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- Asistencia
create table attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  status text not null check (status in ('present', 'absent_justified', 'absent_unjustified')),
  justified_reason text,
  registered_by uuid references users(id),
  created_at timestamptz not null default now(),
  unique (event_id, player_id)
);

-- Causales de apercibimiento
create table sanction_causes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Observaciones en eventos
create table observations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  observation_type text not null check (observation_type in ('highlight', 'warning', 'sanction')),
  sanction_cause_id uuid references sanction_causes(id),
  notes text,
  registered_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- Convocatorias
create table convocations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  created_by uuid references users(id),
  is_reused boolean not null default false,
  whatsapp_message text,
  created_at timestamptz not null default now()
);

-- Jugadores en convocatoria
create table convocation_players (
  id uuid primary key default gen_random_uuid(),
  convocation_id uuid references convocations(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  position text,
  is_exception boolean not null default false,
  created_at timestamptz not null default now()
);

-- Configuración de elegibilidad
create table eligibility_config (
  id uuid primary key default gen_random_uuid(),
  min_attendance_percentage integer not null default 50,
  updated_at timestamptz not null default now(),
  updated_by uuid references users(id)
);

-- Sesiones de caja
create table cash_sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  opening_amount numeric not null,
  closing_amount numeric,
  opened_by uuid references users(id),
  closed_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- Categorías financieras
create table finance_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  movement_type text not null check (movement_type in ('income', 'expense', 'both')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Movimientos de caja
create table cash_movements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references cash_sessions(id) on delete cascade,
  movement_type text not null check (movement_type in ('income', 'expense')),
  amount numeric not null,
  finance_category_id uuid references finance_categories(id),
  description text,
  payment_method text not null check (payment_method in ('cash', 'transfer')),
  transfer_reference text,
  registered_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- Trigger: incrementar convocation_count al confirmar convocatoria
create or replace function increment_convocation_count()
returns trigger as $$
begin
  update players set convocation_count = convocation_count + 1 where id = NEW.player_id;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_increment_convocation_count
after insert on convocation_players
for each row execute function increment_convocation_count();

-- Datos pre-cargados: causales de apercibimiento
insert into sanction_causes (name) values
  ('Mala conducta'),
  ('Falta de respeto al árbitro'),
  ('Falta de respeto al entrenador'),
  ('Falta de respeto a compañeros'),
  ('Indisciplina táctica'),
  ('Llegada tarde reiterada'),
  ('Uso de lenguaje inapropiado');

-- Datos pre-cargados: categorías financieras
insert into finance_categories (name, movement_type) values
  ('Cuotas cobradas', 'income'),
  ('Matrículas cobradas', 'income'),
  ('Donaciones', 'income'),
  ('Otros ingresos', 'income'),
  ('Alquiler de cancha', 'expense'),
  ('Materiales deportivos', 'expense'),
  ('Arbitraje', 'expense'),
  ('Mantenimiento', 'expense'),
  ('Indumentaria', 'expense'),
  ('Transporte', 'expense'),
  ('Inscripciones a torneos', 'expense'),
  ('Otros gastos', 'expense');

-- Configuración inicial de elegibilidad
insert into eligibility_config (min_attendance_percentage) values (50);

-- RLS: habilitar en todas las tablas
alter table players enable row level security;
alter table attendance enable row level security;
alter table payments enable row level security;
alter table cash_sessions enable row level security;
alter table cash_movements enable row level security;
alter table convocations enable row level security;
alter table convocation_players enable row level security;
alter table observations enable row level security;
alter table categories enable row level security;
alter table fee_config enable row level security;
alter table finance_categories enable row level security;
alter table sanction_causes enable row level security;
alter table eligibility_config enable row level security;

-- RLS policies: admin accede a todo
create policy "admin_all" on players for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);
create policy "admin_all" on payments for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);
create policy "admin_all" on cash_sessions for all using (
  exists (select 1 from users where id = auth.uid() and role in ('admin', 'tesorero'))
);
create policy "admin_all" on cash_movements for all using (
  exists (select 1 from users where id = auth.uid() and role in ('admin', 'tesorero'))
);

-- RLS policies: profe accede solo a su categoría
create policy "profe_own_category_players" on players for select using (
  exists (
    select 1 from profe_categories pc
    join users u on u.id = pc.profe_id
    where u.id = auth.uid() and u.role = 'profe' and pc.category_id = players.category_id
  )
);
create policy "profe_own_category_attendance" on attendance for all using (
  exists (
    select 1 from events e
    join profe_categories pc on pc.category_id = e.category_id
    join users u on u.id = pc.profe_id
    where u.id = auth.uid() and u.role = 'profe' and e.id = attendance.event_id
  )
);
```

---

## Lineamientos de Diseño UI

**Estilo general:**
Deportivo e institucional. Tipografía bold y protagonista inspirada en el mundo del fútbol. Números grandes como marcador de partido. El diseño transmite la identidad del club sin ser recargado.

**Colores y branding:**
- Verde Banfield: `#00843D` (primario, botones, sidebar activo, cards de acción)
- Blanco: `#FFFFFF` (fondos, texto sobre verde)
- Dorado/Champagne: `#C9A84C` (acento, estrellas, bordes de destacados)
- Rojo alerta: `#DC2626` (deudores, apercibimientos, cards críticas)
- Amarillo advertencia: `#F59E0B` (llamados de atención, próximos vencimientos)
- Gris neutro: `#F3F4F6` (fondos de secciones, jugadores no elegibles)

El escudo del Club Atlético Banfield (`CA_Banfield_(2014).svg.png`) se usa como logo de la app en el header y en la pantalla de login.

**Tipografía:**
- Títulos y números grandes: **Barlow Condensed** (bold, impacto visual de marcador)
- Texto de interfaz: **Inter** (legibilidad en listas, formularios, etiquetas)

**Componentes y Layout:**
- Sidebar izquierdo compacto con íconos (sin texto) en desktop. En mobile: bottom navigation bar con 5 ítems principales.
- Dashboard con cards de KPIs grandes estilo referencia (similar a Lila), gráfico de dona para recaudación.
- Lista de jugadores: card con foto circular, nombre, badge de estado de cuota (verde/amarillo/rojo), porcentaje de asistencia.
- Pantalla de asistencia: lista vertical optimizada para pulgar, jugadores en verde por defecto, tap para marcar ausente.
- Pantalla de convocatoria: campo de fútbol visto desde arriba (verde con líneas blancas) donde se posicionan las fotos circulares de los jugadores convocados.
- Jugadores no elegibles: fondo gris, nombre con menor opacidad, chip rojo "No elegible".

**Referencias visuales:**
Se proporcionó el escudo oficial del Club Atlético Banfield (verde, blanco y dorado) y una captura del dashboard de Lila (app de gestión de clubes) como referencia de layout y distribución de KPIs. El diseño debe seguir la estructura de dos columnas en desktop del dashboard de referencia, adaptando la paleta a los colores institucionales de Banfield.

---

## Alcance del Proyecto

**Características incluidas en esta versión:**
Todas las funcionalidades detalladas en este documento: gestión de socios y jugadores, cuotas y pagos con registro de transferencias, control de asistencia con fórmula de elegibilidad, observaciones disciplinarias y de desempeño, fixture por categoría con reprogramación, convocatorias con vista de cancha y mensaje WhatsApp, control de caja diaria con apertura y cierre, gestión de ingresos y egresos por categoría, y dashboard con KPIs financieros y deportivos. La app funciona como PWA con soporte offline para toma de asistencia.

**Fuera de alcance (exclusiones):**
No formarán parte de esta primera versión:
- Portal o app para padres y jugadores
- Generación de imagen de convocatoria (previsto para v2)
- Cobro online integrado vía MercadoPago
- Exportación de reportes a Excel o PDF
- Integración con sistemas de la AFA, liga oficial o federaciones
- Notificaciones push automáticas

---

## Orden de construcción sugerido

1. **Setup**: repositorio GitHub → Vercel → Supabase → variables de entorno → configuración PWA con next-pwa
2. **Schema SQL**: ejecutar el schema completo en Supabase SQL Editor incluyendo triggers y datos pre-cargados
3. **Autenticación**: login con Supabase Auth + middleware de rutas protegidas + middleware de roles (admin / profe / tesorero)
4. **Configuración**: pantalla de admin para gestionar categorías activas, cuotas, causales de apercibimiento, categorías financieras, umbral de elegibilidad, usuarios del sistema
5. **Gestión de socios y jugadores**: listado con filtros, ficha completa con foto (upload a Supabase Storage), alta y edición
6. **Pagos y deudores**: registro de pagos (efectivo / transferencia), estado de cuota por jugador, listado de deudores con botón WhatsApp al tutor
7. **Asistencia offline**: pantalla de toma de asistencia con IndexedDB para persistencia offline y sincronización automática al recuperar conexión
8. **Fixture**: calendario de partidos por categoría, creación y edición, reprogramación con selector de convocatoria
9. **Convocatoria**: pantalla de selección de plantel con elegibles/no elegibles, vista de cancha con fotos, generador de mensaje WhatsApp
10. **Observaciones**: formulario de observaciones en eventos (destacado / llamado de atención / apercibimiento con causal)
11. **Caja y finanzas**: apertura, movimientos, cierre de caja, historial por mes
12. **Dashboard**: KPIs, gráfico de dona de recaudación, accesos rápidos, próximo partido
13. **Polish**: diseño responsive mobile-first, estados vacíos, manejo de errores, feedback offline/online
14. **Testing en producción y ajustes finales**

---

## Nota final

Utilizá toda la información proporcionada arriba al construir la aplicación. Seguí al pie de la letra los lineamientos y no asumas requisitos adicionales fuera de esta especificación. Si algo resulta ambiguo, priorizá siempre la interpretación que mantenga la lógica del producto según la visión descrita.

Estamos construyendo la aplicación de forma iterativa. Una vez completada la base según este PRD, seguiremos refinando en interacciones posteriores.

El escudo del club se encuentra en: `C:\Users\Windows 11\Downloads\CA_Banfield_(2014).svg.png` — copiarlo a `/public/escudo-banfield.png` en el proyecto.
