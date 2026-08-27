-- =============================================================================
-- RISA - Tabla de metadatos demograficos de pacientes (patients.csv)
-- =============================================================================
-- Ejecutar una vez en el SQL Editor de Supabase, despues de crear risa_master_data.
--
-- QUE HACE: crea risa_patients con un registro por paciente (1000 filas), con
-- patient_id como llave primaria en el mismo formato "PAT-0000" que ya usan
-- risa_master_data, risa_alerts y risa_ai_insights. No es una tabla EAV: aqui cada
-- columna es un atributo demografico/administrativo fijo del paciente, no una
-- lectura en el tiempo.
--
-- POR QUE separada de risa_master_data: esta última son 2.36M lecturas (una fila
-- por medicion), sin una fila "maestra" por paciente. risa_patients cubre ese
-- hueco para poder filtrar/mostrar el directorio sin escanear las lecturas.
-- =============================================================================

create table if not exists risa_patients (
  patient_id             text primary key check (patient_id ~ '^PAT-\d{4}$'),
  sex_at_birth            text not null check (sex_at_birth in ('M', 'F')),
  age_years               smallint not null check (age_years between 0 and 130),
  age_group               text not null,
  region_type             text not null,
  care_program            text not null,
  baseline_risk_profile   text not null,
  enrollment_date         date not null,
  active                  boolean not null default true
);

-- Indices para los filtros del directorio (busqueda por texto es sobre patient_id,
-- que ya esta cubierto por la PK).
create index if not exists risa_patients_region_idx  on risa_patients (region_type);
create index if not exists risa_patients_program_idx on risa_patients (care_program);
create index if not exists risa_patients_age_group_idx on risa_patients (age_group);

-- -----------------------------------------------------------------------------
-- RLS: mismo patron que las otras 3 tablas (ver supabase/rls.sql) -- solo lectura
-- para la clave anonima, sin politicas de escritura (la carga es unica, vía el
-- importador de CSV del Table Editor, con la clave de service_role que ignora RLS).
-- -----------------------------------------------------------------------------
alter table risa_patients enable row level security;

drop policy if exists risa_patients_read on risa_patients;

create policy risa_patients_read
  on risa_patients for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- OPCIONAL -- integridad referencial: liga risa_master_data.patient_id (y las
-- demas tablas) a risa_patients.patient_id como padre. No es necesaria para que
-- la app funcione (los joins son por codigo, en JS, no vía FK/PostgREST embed),
-- así que se deja comentada: en risa_master_data son 2.36M filas y VALIDATE
-- CONSTRAINT las recorre todas. Solo ejecutar esto si de verdad quieres el
-- constraint a nivel de base, y despues de importar risa_patients (si no, cualquier
-- patient_id de una lectura que no exista todavia en risa_patients hara fallar el
-- ALTER).
-- -----------------------------------------------------------------------------
-- alter table risa_master_data
--   add constraint risa_master_data_patient_fk
--   foreign key (patient_id) references risa_patients (patient_id);
--
-- alter table risa_alerts
--   add constraint risa_alerts_patient_fk
--   foreign key (patient_id) references risa_patients (patient_id);
--
-- alter table risa_ai_insights
--   add constraint risa_ai_insights_patient_fk
--   foreign key (patient_id) references risa_patients (patient_id);

-- -----------------------------------------------------------------------------
-- Verificacion
-- -----------------------------------------------------------------------------
-- select count(*) from risa_patients;  -- debe dar 1000
-- select tablename, rowsecurity from pg_tables where tablename = 'risa_patients';
