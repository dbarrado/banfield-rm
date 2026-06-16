-- ============================================================================
-- Plantel — Schema inicial (Postgres / Supabase)
-- Derivado fielmente de types/index.ts + lib/*.ts (modo demo).
-- Multi-tenant: club_id en cada tabla operativa + RLS por club.
-- Convenciones:
--   · PK uuid con gen_random_uuid()
--   · created_at timestamptz default now()
--   · arrays/objetos anidados del modelo TS → jsonb
--   · enums del modelo TS → text + CHECK (Tira es string flexible por diseño)
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. CLUBS (tenant raíz)
-- ----------------------------------------------------------------------------
create table clubs (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique,
  short_name          text not null,
  logo_url            text,
  primary_color       text not null default '#1d4ed8',
  secondary_color     text not null default '#00843D',
  city                text,
  is_active           boolean not null default true,
  plan                text not null default 'free' check (plan in ('free','club','pro','enterprise')),
  default_sport_code  text not null default 'football_11',
  total_socios        integer default 0,
  -- referidos / growth
  referral_code       text unique,
  first_payment_at    timestamptz,
  successful_referrals integer not null default 0,
  has_shop_addon      boolean not null default false,
  created_at          timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. AUTH / USUARIOS / MEMBRESÍA
--    profiles 1:1 con auth.users. user_clubs = M2M usuario↔club con roles.
-- ----------------------------------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text not null default '',
  created_at  timestamptz not null default now()
);

create table user_clubs (
  user_id     uuid not null references profiles(id) on delete cascade,
  club_id     uuid not null references clubs(id) on delete cascade,
  roles       text[] not null default '{}',  -- subset de: super_admin, admin, profe, tesorero, coordinador
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  primary key (user_id, club_id)
);

-- helper: ids de clubes a los que pertenece el usuario actual
create or replace function current_user_club_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select club_id from user_clubs where user_id = auth.uid() and is_active;
$$;

-- ----------------------------------------------------------------------------
-- 3. DEPORTES (catálogo global, no por club)
-- ----------------------------------------------------------------------------
create table sport_formats (
  code              text primary key,        -- football_11, baby_5, baby_6, futsal, hockey_field, volleyball, basketball, rugby_7, rugby_15, handball_7
  name              text not null,
  players_on_field  integer not null,
  has_goalkeeper    boolean not null default true,
  field_ratio       numeric,
  positions         jsonb not null default '[]',  -- layout de posiciones
  discipline_cards  jsonb not null default '[]',  -- tarjetas propias del deporte
  is_active         boolean not null default true
);

-- ----------------------------------------------------------------------------
-- 4. CATEGORÍAS (por club; sport_format por categoría)
-- ----------------------------------------------------------------------------
create table categories (
  id                uuid primary key default gen_random_uuid(),
  club_id           uuid not null references clubs(id) on delete cascade,
  name              text not null,
  birth_year        integer,
  sport_format_code text references sport_formats(code),
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);
create index on categories (club_id);

-- ----------------------------------------------------------------------------
-- 5. PROFES (con compliance argentino de protección de menores)
-- ----------------------------------------------------------------------------
create table profes (
  id                            uuid primary key default gen_random_uuid(),
  club_id                       uuid not null references clubs(id) on delete cascade,
  full_name                     text not null,
  dni                           text,
  birth_date                    date,
  photo_url                     text,
  email                         text,
  whatsapp                      text,
  phone_alt                     text,
  emergency_contact_name        text,
  emergency_contact_phone       text,
  start_date                    date,
  title_certifications          text,
  matricula                     text,
  antecedentes_penales_url      text,
  antecedentes_penales_expires_at   date,
  antecedentes_sexuales_url     text,
  antecedentes_sexuales_expires_at  date,
  apto_psicofisico_url          text,
  apto_psicofisico_expires_at   date,
  safeguarding_course_completed boolean not null default false,
  safeguarding_course_date      date,
  payment_method                text check (payment_method in ('recibo','factura','sueldo','ad_honorem')),
  cbu_alias                     text,
  hourly_rate                   numeric,
  monthly_salary                numeric,
  is_active                     boolean not null default true,
  notes                         text,
  created_at                    timestamptz not null default now()
);
create index on profes (club_id);

create table profe_assignments (
  profe_id    uuid not null references profes(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  tira        text not null,
  primary key (profe_id, category_id, tira)
);

-- ----------------------------------------------------------------------------
-- 6. JUGADORES / SOCIOS
-- ----------------------------------------------------------------------------
create table players (
  id                    uuid primary key default gen_random_uuid(),
  club_id               uuid not null references clubs(id) on delete cascade,
  full_name             text not null,
  dni                   text,
  birth_date            date,
  category_id           uuid references categories(id) on delete set null,
  tira                  text,
  shift                 text check (shift in ('morning','afternoon')),
  photo_url             text,
  tutor_name            text,
  tutor_dni             text,
  tutor_email           text,
  tutor_whatsapp        text,
  alt_contacts          jsonb not null default '[]',  -- [{name, whatsapp, relation}]
  primary_position      text,
  secondary_positions   jsonb not null default '[]',  -- Position[]
  apto_medico_ok        boolean not null default false,
  apto_medico_file_url  text,
  apto_medico_expires_at date,
  is_active             boolean not null default true,
  convocation_count     integer not null default 0,
  created_at            timestamptz not null default now()
);
create index on players (club_id);
create index on players (category_id);
create index on players (club_id, dni);

-- Consentimientos de imagen (Ley 26.061) — 1:1 con player
create table image_consents (
  player_id          uuid primary key references players(id) on delete cascade,
  for_team_photos    boolean not null default false,
  for_match_videos   boolean not null default false,
  for_social_media   boolean not null default false,
  for_training_clips boolean not null default false,
  signed_by_tutor_dni text,
  signed_at          timestamptz
);

-- ----------------------------------------------------------------------------
-- 7. TUTORES (self-onboarding, cross-club)
-- ----------------------------------------------------------------------------
create table tutor_users (
  id          uuid primary key default gen_random_uuid(),
  email       text,
  dni         text not null unique,
  full_name   text not null,
  whatsapp    text,
  created_at  timestamptz not null default now()
);

create table tutor_player_links (
  tutor_user_id uuid not null references tutor_users(id) on delete cascade,
  player_id     uuid not null references players(id) on delete cascade,
  relation      text not null check (relation in ('padre','madre','tutor','abuelo','otro')),
  is_primary    boolean not null default false,
  approved_at   timestamptz,
  primary key (tutor_user_id, player_id)
);

-- ----------------------------------------------------------------------------
-- 8. INSCRIPCIÓN (registration codes + pending)
-- ----------------------------------------------------------------------------
create table registration_codes (
  id            uuid primary key default gen_random_uuid(),
  club_id       uuid not null references clubs(id) on delete cascade,
  category_id   uuid not null references categories(id) on delete cascade,
  code          text not null unique,
  expires_at    date,
  max_uses      integer,
  current_uses  integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  created_by    uuid references profiles(id)
);
create index on registration_codes (club_id);

create table pending_registrations (
  id                    uuid primary key default gen_random_uuid(),
  club_id               uuid not null references clubs(id) on delete cascade,
  category_id           uuid references categories(id) on delete set null,
  code_used             text,
  full_name             text not null,
  dni                   text not null,
  birth_date            date,
  primary_position      text,
  photo_url             text,
  apto_medico_url       text,
  tutor_full_name       text not null,
  tutor_dni             text not null,
  tutor_whatsapp        text,
  tutor_email           text,
  tutor_relation        text check (tutor_relation in ('padre','madre','tutor','abuelo','otro')),
  status                text not null default 'pending' check (status in ('pending','approved','rejected','merged')),
  duplicate_of_player_id uuid references players(id) on delete set null,
  duplicate_reason      text check (duplicate_reason in ('dni_match','name_match')),
  reviewed_by           uuid references profiles(id),
  reviewed_at           timestamptz,
  rejection_reason      text,
  created_at            timestamptz not null default now()
);
create index on pending_registrations (club_id, status);

-- ----------------------------------------------------------------------------
-- 9. CONFIG POR CLUB (cuotas, descuentos, elegibilidad, cobranza, causales)
-- ----------------------------------------------------------------------------
create table fee_configs (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references clubs(id) on delete cascade,
  fee_type    text not null check (fee_type in ('actividad','social','matricula')),
  amount      numeric not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references profiles(id),
  unique (club_id, fee_type)
);

create table sibling_discount_configs (
  club_id           uuid primary key references clubs(id) on delete cascade,
  second_child_pct  numeric not null default 50,
  third_or_more_pct numeric not null default 75,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references profiles(id)
);

create table eligibility_configs (
  club_id                uuid primary key references clubs(id) on delete cascade,
  min_practice_percentage numeric not null default 70,
  min_match_percentage    numeric not null default 0,
  updated_at             timestamptz not null default now(),
  updated_by             uuid references profiles(id)
);

create table eligibility_change_logs (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid not null references clubs(id) on delete cascade,
  type            text not null check (type in ('practice_threshold','match_threshold','convocation_override')),
  scope           text not null check (scope in ('club','convocation')),
  convocation_id  uuid,
  category_name   text,
  old_value       numeric,
  new_value       numeric,
  changed_by      text,
  changed_at      timestamptz not null default now(),
  reason          text
);

create table billing_configs (
  club_id           uuid primary key references clubs(id) on delete cascade,
  overdue_day       integer not null default 16,
  late_fee_pct      numeric not null default 10,
  due_day           integer not null default 10,
  mp_surcharge_pct  numeric not null default 10
);

create table sanction_causes (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references clubs(id) on delete cascade,
  name        text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table finance_categories (
  id            uuid primary key default gen_random_uuid(),
  club_id       uuid not null references clubs(id) on delete cascade,
  name          text not null,
  movement_type text not null check (movement_type in ('income','expense','both')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 10. CRONOGRAMA DE ENTRENAMIENTOS
-- ----------------------------------------------------------------------------
create table training_slots (
  id                  uuid primary key default gen_random_uuid(),
  club_id             uuid not null references clubs(id) on delete cascade,
  day_of_week         integer not null check (day_of_week between 0 and 6),  -- 0=domingo
  start_time          time not null,
  end_time            time not null,
  court               integer,
  category_ids        jsonb not null default '[]',  -- uuid[] de categories
  tiras               jsonb not null default '[]',  -- Tira[]
  profe_titular_id    uuid references profes(id) on delete set null,
  profe_suplentes_ids jsonb not null default '[]',  -- uuid[] de profes
  notes               text,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);
create index on training_slots (club_id, day_of_week);

-- ----------------------------------------------------------------------------
-- 11. EVENTOS (prácticas / partidos) + asistencia + observaciones
-- ----------------------------------------------------------------------------
create table events (
  id                uuid primary key default gen_random_uuid(),
  club_id           uuid not null references clubs(id) on delete cascade,
  category_id       uuid references categories(id) on delete set null,
  event_type        text not null check (event_type in ('practice','match')),
  scheduled_at      timestamptz not null,
  is_suspended      boolean not null default false,
  suspension_reason text,
  rival             text,
  venue             text,
  is_home           boolean,
  created_by        uuid references profiles(id),
  created_at        timestamptz not null default now()
);
create index on events (club_id, scheduled_at);

create table attendances (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  player_id       uuid not null references players(id) on delete cascade,
  status          text not null check (status in ('present','late','absent_justified','absent_unjustified')),
  justified_reason text,
  registered_by   uuid references profiles(id),
  created_at      timestamptz not null default now(),
  unique (event_id, player_id)
);
create index on attendances (event_id);
create index on attendances (player_id);

create table observations (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references events(id) on delete cascade,
  player_id         uuid not null references players(id) on delete cascade,
  observation_type  text not null check (observation_type in ('highlight','warning','sanction')),
  sanction_cause_id uuid references sanction_causes(id) on delete set null,
  notes             text,
  registered_by     uuid references profiles(id),
  created_at        timestamptz not null default now()
);

-- Puntajes deportivos del partido (1-10 + comentario)
create table match_ratings (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references events(id) on delete cascade,
  player_id         uuid not null references players(id) on delete cascade,
  score             numeric check (score between 1 and 10),
  comment           text,
  rated_by_profe_id uuid references profes(id) on delete set null,
  created_at        timestamptz not null default now(),
  unique (event_id, player_id)
);

-- Asistencia de profes (la toma el coordinador)
create table profe_attendance_records (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid not null references clubs(id) on delete cascade,
  profe_id        uuid not null references profes(id) on delete cascade,
  date            date not null,
  slot_id         uuid references training_slots(id) on delete set null,
  status          text not null check (status in ('present','absent','late','replaced')),
  replaced_by_id  uuid references profes(id) on delete set null,
  notes           text,
  registered_by   uuid references profiles(id),
  registered_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 12. CONVOCATORIAS
-- ----------------------------------------------------------------------------
create table convocations (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references events(id) on delete cascade,
  created_by       uuid references profiles(id),
  is_reused        boolean not null default false,
  whatsapp_message text,
  created_at       timestamptz not null default now()
);

create table convocation_players (
  id              uuid primary key default gen_random_uuid(),
  convocation_id  uuid not null references convocations(id) on delete cascade,
  player_id       uuid not null references players(id) on delete cascade,
  position        text,
  is_exception    boolean not null default false,
  created_at      timestamptz not null default now()
);
create index on convocation_players (convocation_id);

-- ----------------------------------------------------------------------------
-- 13. CAJA / FINANZAS
-- ----------------------------------------------------------------------------
create table cash_sessions (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid not null references clubs(id) on delete cascade,
  date            date not null,
  opening_amount  numeric not null default 0,
  closing_amount  numeric,
  opened_by       uuid references profiles(id),
  closed_by       uuid references profiles(id),
  created_at      timestamptz not null default now()
);
create index on cash_sessions (club_id, date);

create table cash_movements (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references cash_sessions(id) on delete cascade,
  movement_type       text not null check (movement_type in ('income','expense')),
  amount              numeric not null,
  finance_category_id uuid references finance_categories(id) on delete set null,
  description         text,
  payment_method      text check (payment_method in ('cash','transfer','mercadopago')),
  transfer_reference  text,
  receipt_url         text,            -- comprobante subido (POST-DEMO: OCR real)
  ocr_raw_response    jsonb,           -- auditoría del OCR (POST-DEMO)
  registered_by       uuid references profiles(id),
  created_at          timestamptz not null default now()
);
create index on cash_movements (session_id);

-- ----------------------------------------------------------------------------
-- 14. CUOTAS (billings) + pagos
-- ----------------------------------------------------------------------------
create table billings (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid not null references clubs(id) on delete cascade,
  player_id       uuid not null references players(id) on delete cascade,
  fee_type        text not null check (fee_type in ('actividad','social','matricula')),
  period          text not null,        -- YYYY-MM
  amount_original numeric not null,
  discount_pct    numeric not null default 0,
  amount_final    numeric not null,
  due_date        date not null,
  status          text not null check (status in ('paid','pending','overdue','overdue_with_fee','condoned','partial')),
  late_fee_amount numeric not null default 0,
  amount_paid     numeric not null default 0,
  paid_at         timestamptz,
  payment_method  text check (payment_method in ('cash','transfer','mercadopago')),
  adjustments     jsonb not null default '[]',  -- BillingAdjustment[]
  created_at      timestamptz not null default now(),
  unique (player_id, fee_type, period)
);
create index on billings (club_id, period);
create index on billings (club_id, status);

create table payments (
  id                 uuid primary key default gen_random_uuid(),
  club_id            uuid not null references clubs(id) on delete cascade,
  player_id          uuid not null references players(id) on delete cascade,
  billing_id         uuid references billings(id) on delete set null,
  fee_type           text not null check (fee_type in ('actividad','social','matricula')),
  period             text not null,
  amount             numeric not null,
  paid_at            timestamptz not null default now(),
  payment_method     text not null check (payment_method in ('cash','transfer','mercadopago')),
  transfer_reference text,
  registered_by      uuid references profiles(id),
  created_at         timestamptz not null default now()
);
create index on payments (club_id);
create index on payments (player_id);

-- ----------------------------------------------------------------------------
-- 15. TIENDA (add-on Shop)
-- ----------------------------------------------------------------------------
create table products (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references clubs(id) on delete cascade,
  name        text not null,
  category    text check (category in ('camiseta','remera','short','medias','buzo','mochila','gorra','pelota','otros')),
  description text,
  price       numeric not null,
  image_color text,
  emoji       text,
  variants    jsonb not null default '[]',  -- [{id,size,stock,sku}]
  is_active   boolean not null default true,
  featured    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on products (club_id);

create table orders (
  id                uuid primary key default gen_random_uuid(),
  club_id           uuid not null references clubs(id) on delete cascade,
  customer_name     text not null,
  customer_email    text,
  customer_whatsapp text,
  items             jsonb not null default '[]',  -- OrderItem[]
  subtotal          numeric not null default 0,
  total             numeric not null default 0,
  status            text not null default 'pending_payment' check (status in ('pending_payment','paid','preparing','ready','delivered','cancelled')),
  payment_method    text check (payment_method in ('mercadopago','cash_on_pickup')),
  payment_id        text,
  pickup_location   text,
  notes             text,
  created_at        timestamptz not null default now(),
  paid_at           timestamptz
);
create index on orders (club_id, status);

-- ----------------------------------------------------------------------------
-- 16. REFERIDOS
-- ----------------------------------------------------------------------------
create table referrals (
  id                 uuid primary key default gen_random_uuid(),
  referrer_club_id   uuid not null references clubs(id) on delete cascade,
  referred_club_name text not null,
  referred_at        date,
  status             text not null default 'registered' check (status in ('registered','in_trial','successful','cancelled')),
  reward_applied_at  timestamptz,
  referred_plan      text check (referred_plan in ('club','pro','pro_plus_shop')),
  created_at         timestamptz not null default now()
);
create index on referrals (referrer_club_id);

-- ============================================================================
-- 17. PLANIFICACIÓN DE CLASES  ⚠️ DISEÑO PROPUESTO — ajustar con esquema de Emmanuel
--     Pedido: ~3 ejercicios por clase, que varían semana a semana por categoría.
--     · exercises          = biblioteca reutilizable de ejercicios por club
--     · session_plans      = plan de UNA clase (categoría + fecha/semana)
--     · session_plan_items = los ejercicios de ese plan, en orden (los ~3)
-- ============================================================================
create table exercises (
  id            uuid primary key default gen_random_uuid(),
  club_id       uuid not null references clubs(id) on delete cascade,
  name          text not null,
  description   text,
  objective     text,            -- técnico / táctico / físico / coordinación (ajustar a Emmanuel)
  duration_min  integer,
  material      text,
  diagram_url   text,
  sport_format_code text references sport_formats(code),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index on exercises (club_id);

create table session_plans (
  id            uuid primary key default gen_random_uuid(),
  club_id       uuid not null references clubs(id) on delete cascade,
  category_id   uuid references categories(id) on delete set null,
  tira          text,
  week_start    date,            -- semana a la que pertenece (lunes)
  session_date  date,            -- fecha concreta de la clase (opcional)
  slot_id       uuid references training_slots(id) on delete set null,
  title         text,
  notes         text,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now()
);
create index on session_plans (club_id, category_id, week_start);

create table session_plan_items (
  id              uuid primary key default gen_random_uuid(),
  session_plan_id uuid not null references session_plans(id) on delete cascade,
  exercise_id     uuid references exercises(id) on delete set null,
  position        integer not null default 1,   -- orden dentro de la clase (1,2,3...)
  duration_min    integer,
  notes           text,
  created_at      timestamptz not null default now()
);
create index on session_plan_items (session_plan_id);

-- ============================================================================
-- RLS — habilitar en todas las tablas y políticas multi-tenant por club.
-- Patrón: una fila es visible/editable si su club_id ∈ current_user_club_ids().
-- Catálogo global (sport_formats) = lectura para todos los autenticados.
-- profiles / tutor_users = el propio usuario; el resto vía service_role.
-- ============================================================================

-- catálogo global
alter table sport_formats enable row level security;
create policy sport_formats_read on sport_formats for select using (auth.role() = 'authenticated');

-- profiles
alter table profiles enable row level security;
create policy profiles_self on profiles for all using (id = auth.uid()) with check (id = auth.uid());

-- user_clubs
alter table user_clubs enable row level security;
create policy user_clubs_self on user_clubs for select using (user_id = auth.uid());

-- clubs (visible si el usuario es miembro)
alter table clubs enable row level security;
create policy clubs_member on clubs for all
  using (id in (select current_user_club_ids()))
  with check (id in (select current_user_club_ids()));

-- tablas tenant con columna club_id directa
do $$
declare t text;
begin
  foreach t in array array[
    'categories','profes','players','registration_codes','pending_registrations',
    'fee_configs','sibling_discount_configs','eligibility_configs','eligibility_change_logs',
    'billing_configs','sanction_causes','finance_categories','training_slots','events',
    'profe_attendance_records','cash_sessions','billings','payments','products','orders',
    'exercises','session_plans'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$create policy %1$s_tenant on %1$I for all
      using (club_id in (select current_user_club_ids()))
      with check (club_id in (select current_user_club_ids()));$f$, t);
  end loop;
end $$;

-- referrals usa referrer_club_id
alter table referrals enable row level security;
create policy referrals_tenant on referrals for all
  using (referrer_club_id in (select current_user_club_ids()))
  with check (referrer_club_id in (select current_user_club_ids()));

-- tablas hijas (sin club_id propio): se resuelven vía el padre
alter table profe_assignments enable row level security;
create policy profe_assignments_tenant on profe_assignments for all
  using (exists (select 1 from profes p where p.id = profe_id and p.club_id in (select current_user_club_ids())));

alter table image_consents enable row level security;
create policy image_consents_tenant on image_consents for all
  using (exists (select 1 from players pl where pl.id = player_id and pl.club_id in (select current_user_club_ids())));

alter table attendances enable row level security;
create policy attendances_tenant on attendances for all
  using (exists (select 1 from events e where e.id = event_id and e.club_id in (select current_user_club_ids())));

alter table observations enable row level security;
create policy observations_tenant on observations for all
  using (exists (select 1 from events e where e.id = event_id and e.club_id in (select current_user_club_ids())));

alter table match_ratings enable row level security;
create policy match_ratings_tenant on match_ratings for all
  using (exists (select 1 from events e where e.id = event_id and e.club_id in (select current_user_club_ids())));

alter table convocations enable row level security;
create policy convocations_tenant on convocations for all
  using (exists (select 1 from events e where e.id = event_id and e.club_id in (select current_user_club_ids())));

alter table convocation_players enable row level security;
create policy convocation_players_tenant on convocation_players for all
  using (exists (select 1 from convocations c join events e on e.id = c.event_id
                 where c.id = convocation_id and e.club_id in (select current_user_club_ids())));

alter table cash_movements enable row level security;
create policy cash_movements_tenant on cash_movements for all
  using (exists (select 1 from cash_sessions s where s.id = session_id and s.club_id in (select current_user_club_ids())));

alter table session_plan_items enable row level security;
create policy session_plan_items_tenant on session_plan_items for all
  using (exists (select 1 from session_plans sp where sp.id = session_plan_id and sp.club_id in (select current_user_club_ids())));

-- tutores: cross-club, gestionados vía service_role / RPC (sin policy de cliente por ahora)
alter table tutor_users enable row level security;
alter table tutor_player_links enable row level security;
