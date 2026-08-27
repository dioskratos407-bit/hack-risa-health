-- =============================================================================
-- RISA - Eventos de conectividad y contexto del paciente
-- (connectivity_events.csv, patient_context.csv)
-- =============================================================================
-- Ejecutar en el SQL Editor de Supabase, DESPUES de:
--   1) supabase/patients_table.sql
--   2) supabase/facilities_devices_encounters.sql
-- (risa_connectivity_events depende de risa_devices y risa_patients, que
-- deben existir ya. risa_patient_context depende solo de risa_patients.)
--
-- Sin dependencia entre si -- se pueden crear en cualquier orden dentro de
-- este script.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) risa_connectivity_events  (connectivity_events.csv)
-- -----------------------------------------------------------------------------
-- Enlaza con risa_devices (siempre un WRB-, el wearable) y con risa_patients.
-- Util para correlacionar huecos de monitoreo (alertas perdidas, datos
-- retrasados) con problemas de conectividad del dispositivo del paciente.
create table if not exists risa_connectivity_events (
  event_id              text primary key check (event_id ~ '^CONN-\d{6}$'),
  device_id             text not null references risa_devices (device_id),
  patient_id            text not null references risa_patients (patient_id),
  start_datetime        timestamptz not null,
  end_datetime          timestamptz not null,
  connectivity_status   text not null,
  delayed_records       integer not null,
  packet_loss_estimate  numeric not null
);

create index if not exists risa_conn_events_device_idx  on risa_connectivity_events (device_id);
create index if not exists risa_conn_events_patient_idx on risa_connectivity_events (patient_id);
create index if not exists risa_conn_events_start_idx   on risa_connectivity_events (start_datetime);

alter table risa_connectivity_events enable row level security;
drop policy if exists risa_conn_events_read on risa_connectivity_events;
create policy risa_conn_events_read
  on risa_connectivity_events for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- 2) risa_patient_context  (patient_context.csv)
-- -----------------------------------------------------------------------------
-- Contexto conductual/fisiologico del paciente (sueno, actividad fisica, etc.)
-- capturado por el wearable -- sirve para no confundir una variacion de signos
-- vitales explicada por el contexto (ej. actividad fisica) con una alerta real.
create table if not exists risa_patient_context (
  context_id      text primary key check (context_id ~ '^CTX-\d{7}$'),
  patient_id      text not null references risa_patients (patient_id),
  start_datetime  timestamptz not null,
  end_datetime    timestamptz not null,
  context_type    text not null,
  context_value   text not null,
  source          text not null,
  confidence      numeric not null
);

create index if not exists risa_patient_context_patient_idx on risa_patient_context (patient_id);
create index if not exists risa_patient_context_type_idx    on risa_patient_context (context_type);
create index if not exists risa_patient_context_start_idx   on risa_patient_context (start_datetime);

alter table risa_patient_context enable row level security;
drop policy if exists risa_patient_context_read on risa_patient_context;
create policy risa_patient_context_read
  on risa_patient_context for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- Verificacion
-- -----------------------------------------------------------------------------
-- select count(*) from risa_connectivity_events;
-- select count(*) from risa_patient_context;
-- select tablename, rowsecurity from pg_tables
--   where tablename in ('risa_connectivity_events', 'risa_patient_context');
