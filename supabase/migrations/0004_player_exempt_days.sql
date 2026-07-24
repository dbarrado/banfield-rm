-- Excepciones fijas semanales por jugador: días en que NO viene por un motivo
-- estable (ej. horario del colegio). En la asistencia de esos días el chico se
-- precarga como ausente justificado, así su % de elegibilidad no se ve afectado.
-- Convención day_of_week: 0=Domingo … 6=Sábado (igual que training_slots).

alter table players
  add column if not exists exempt_days smallint[] not null default '{}',
  add column if not exists exempt_reason text;

comment on column players.exempt_days is 'Días de la semana (0=Dom..6=Sáb) en que el jugador no asiste por motivo fijo';
comment on column players.exempt_reason is 'Motivo de la excepción semanal (ej: colegio doble turno los martes)';
