-- =============================================================================
-- RISA - Instalaciones, dispositivos y encuentros clinicos
-- (healthcare_facilities.csv, devices.csv, encounters.csv)
-- =============================================================================
-- Ejecutar una vez en el SQL Editor de Supabase, DESPUES de supabase/patients_table.sql
-- (risa_devices y risa_encounters tienen FK hacia risa_patients, así que esa tabla
-- debe existir primero).
--
-- Orden de creacion dentro de este mismo script: risa_facilities primero (nadie
-- depende de nada), despues risa_devices y risa_encounters (dependen de
-- risa_facilities y de risa_patients).
--
-- A diferencia de risa_master_data (2.36M filas, FK opcional/comentada por costo),
-- estas 3 tablas son chicas (7 instalaciones, ~2000 dispositivos, 1000 encuentros)
-- -- aca sí se agregan las FK reales, sin costo relevante.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) risa_facilities  (healthcare_facilities.csv)
-- -----------------------------------------------------------------------------
create table if not exists risa_facilities (
  facility_id             text primary key check (facility_id ~ '^FAC-\d{2}$'),
  facility_name           text not null,
  facility_type           text not null,
  region_type             text not null,
  digital_maturity        text not null,
  connectivity_profile    text not null,
  monitoring_capability   text not null,
  laboratory_capability   text not null
);

alter table risa_facilities enable row level security;
drop policy if exists risa_facilities_read on risa_facilities;
create policy risa_facilities_read
  on risa_facilities for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- 2) risa_devices  (devices.csv)
-- -----------------------------------------------------------------------------
-- POR QUE assigned_patient_id es nullable: el CSV del reto siempre trae un
-- paciente asignado, pero el dominio (patient_assignment_type = DEDICATED vs.
-- otros valores futuros) no lo garantiza -- no hay razon para forzar NOT NULL
-- sobre un dato que el propio modelo de origen no exige.
create table if not exists risa_devices (
  device_id               text primary key check (device_id ~ '^(DEV|WRB)-\d{5}$'),
  device_type             text not null,
  manufacturer_class      text not null,
  model_family            text not null,
  measurement_domain      text not null,
  sampling_profile        text not null,
  reliability_class       text not null,
  facility_id             text not null references risa_facilities (facility_id),
  patient_assignment_type text not null,
  active                  boolean not null default true,
  assigned_patient_id     text references risa_patients (patient_id)
);

create index if not exists risa_devices_patient_idx  on risa_devices (assigned_patient_id);
create index if not exists risa_devices_facility_idx on risa_devices (facility_id);

alter table risa_devices enable row level security;
drop policy if exists risa_devices_read on risa_devices;
create policy risa_devices_read
  on risa_devices for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- 3) risa_encounters  (encounters.csv)
-- -----------------------------------------------------------------------------
create table if not exists risa_encounters (
  encounter_id     text primary key check (encounter_id ~ '^ENC-\d{6}$'),
  patient_id       text not null references risa_patients (patient_id),
  facility_id      text not null references risa_facilities (facility_id),
  encounter_type   text not null,
  start_datetime   timestamptz not null,
  end_datetime     timestamptz not null,
  care_setting     text not null,
  reason_category  text not null,
  source_system    text not null,
  status           text not null
);

create index if not exists risa_encounters_patient_idx  on risa_encounters (patient_id);
create index if not exists risa_encounters_facility_idx on risa_encounters (facility_id);
create index if not exists risa_encounters_start_idx    on risa_encounters (start_datetime);

alter table risa_encounters enable row level security;
drop policy if exists risa_encounters_read on risa_encounters;
create policy risa_encounters_read
  on risa_encounters for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- Verificacion
-- -----------------------------------------------------------------------------
-- select count(*) from risa_facilities;  -- debe dar 7
-- select count(*) from risa_devices;     -- debe dar 2000 (1000 DEV + 1000 WRB)
-- select count(*) from risa_encounters;  -- debe dar 1000
-- select tablename, rowsecurity from pg_tables
--   where tablename in ('risa_facilities', 'risa_devices', 'risa_encounters');
