-- =============================================================================
-- RISA - Condiciones, resultados de laboratorio y administracion de medicamentos
-- (conditions.csv, laboratory_results.csv, medications.csv, medication_administrations.csv)
-- =============================================================================
-- Ejecutar en el SQL Editor de Supabase, DESPUES de:
--   1) supabase/patients_table.sql
--   2) supabase/facilities_devices_encounters.sql
-- (risa_laboratory_results y risa_medication_administrations dependen de
-- risa_patients y risa_encounters, que deben existir ya).
--
-- Orden dentro de este script: risa_medications primero (catalogo, sin
-- dependencias), despues risa_conditions, risa_laboratory_results y
-- risa_medication_administrations.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) risa_medications  (medications.csv -- catalogo de 5 medicamentos)
-- -----------------------------------------------------------------------------
create table if not exists risa_medications (
  medication_id       text primary key check (medication_id ~ '^MED-\d{3}$'),
  medication_class    text not null,
  generic_category    text not null,
  administration_route text not null
);

alter table risa_medications enable row level security;
drop policy if exists risa_medications_read on risa_medications;
create policy risa_medications_read
  on risa_medications for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- 2) risa_conditions  (conditions.csv -- historial de condiciones por paciente)
-- -----------------------------------------------------------------------------
create table if not exists risa_conditions (
  condition_id      text primary key check (condition_id ~ '^COND-\d{6}$'),
  patient_id        text not null references risa_patients (patient_id),
  condition_category text not null,
  onset_date        date not null,
  status            text not null,
  severity_context  text not null,
  source_system     text not null,
  recorded_datetime timestamptz not null
);

create index if not exists risa_conditions_patient_idx on risa_conditions (patient_id);

alter table risa_conditions enable row level security;
drop policy if exists risa_conditions_read on risa_conditions;
create policy risa_conditions_read
  on risa_conditions for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- 3) risa_laboratory_results  (laboratory_results.csv)
-- -----------------------------------------------------------------------------
create table if not exists risa_laboratory_results (
  lab_result_id     text primary key check (lab_result_id ~ '^LABR-\d{8}$'),
  patient_id        text not null references risa_patients (patient_id),
  encounter_id      text not null references risa_encounters (encounter_id),
  test_code         text not null,
  test_name         text not null,
  result_value      numeric not null,
  unit              text not null,
  reference_low     numeric not null,
  reference_high    numeric not null,
  sample_datetime   timestamptz not null,
  result_datetime   timestamptz not null,
  facility_id       text not null references risa_facilities (facility_id),
  source_system     text not null,
  quality_flag      text not null
);

create index if not exists risa_lab_results_patient_idx   on risa_laboratory_results (patient_id);
create index if not exists risa_lab_results_encounter_idx on risa_laboratory_results (encounter_id);
create index if not exists risa_lab_results_facility_idx  on risa_laboratory_results (facility_id);
create index if not exists risa_lab_results_test_idx      on risa_laboratory_results (test_code);

alter table risa_laboratory_results enable row level security;
drop policy if exists risa_lab_results_read on risa_laboratory_results;
create policy risa_lab_results_read
  on risa_laboratory_results for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- 4) risa_medication_administrations  (medication_administrations.csv)
-- -----------------------------------------------------------------------------
create table if not exists risa_medication_administrations (
  administration_id    text primary key check (administration_id ~ '^ADM-\d{6}$'),
  patient_id            text not null references risa_patients (patient_id),
  encounter_id           text not null references risa_encounters (encounter_id),
  medication_id          text not null references risa_medications (medication_id),
  start_datetime         timestamptz not null,
  end_datetime           timestamptz not null,
  dose_value             numeric not null,
  dose_unit              text not null,
  administration_status  text not null,
  source_system          text not null
);

create index if not exists risa_med_admin_patient_idx    on risa_medication_administrations (patient_id);
create index if not exists risa_med_admin_encounter_idx  on risa_medication_administrations (encounter_id);
create index if not exists risa_med_admin_medication_idx on risa_medication_administrations (medication_id);

alter table risa_medication_administrations enable row level security;
drop policy if exists risa_med_admin_read on risa_medication_administrations;
create policy risa_med_admin_read
  on risa_medication_administrations for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- Verificacion
-- -----------------------------------------------------------------------------
-- select count(*) from risa_medications;               -- debe dar 5
-- select count(*) from risa_conditions;                 -- debe dar ~1484
-- select count(*) from risa_laboratory_results;          -- debe dar ~4593
-- select count(*) from risa_medication_administrations;   -- debe dar ~856
