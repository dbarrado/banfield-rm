-- Performance (auditoría 30-jul-2026, go-live del club):
-- 1. RLS initplan: envolver auth.* en (select ...) para que se evalúe una vez
--    por query y no por fila (advisor auth_rls_initplan).
-- 2. Índices para los caminos calientes de lectura:
--    - events(club_id, category_id, event_type): loadPracticeStatsBulk / convocatoria / fixture
--    - attendances(event_id): agregación de asistencias por evento
--    - session_plans(club_id, session_date): vista mensual del plan y planes del día

alter policy profiles_self on profiles
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

alter policy user_clubs_self on user_clubs
  using (user_id = (select auth.uid()));

alter policy sport_formats_read on sport_formats
  using ((select auth.role()) = 'authenticated');

create index if not exists events_club_cat_type_idx on events (club_id, category_id, event_type);
create index if not exists attendances_event_id_idx on attendances (event_id);
create index if not exists session_plans_club_date_idx on session_plans (club_id, session_date);
