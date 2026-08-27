-- =============================================================================
-- RISA - Auditoria de calidad del pipeline ETL (crudo vs. limpio)
-- =============================================================================
-- Ejecutar una vez en el SQL Editor de Supabase. No depende de ninguna otra tabla
-- nueva (sin FKs), aunque logicamente se relaciona con risa_master_data: estas 2
-- tablas documentan como se llego de los 3 CSV crudos (observations/vital_signs,
-- device_observations, wearable_observations) hasta ese resultado limpio.
--
-- QUE HACEN: dan visibilidad, desde la app, al filtrado que hoy solo se ve en la
-- consola al correr clean_health_data.py.
--
--   risa_etl_quality_audit  -- espejo 1:1 de datos/data_quality_audit.csv: 15 filas
--                               de conteos por etapa/categoria (cuantos se recuperaron
--                               o descartaron y por que).
--   risa_raw_data_sample    -- muestra estratificada y reproducible (~12-15k filas) de
--                               las 3 fuentes crudas, ANTES de cualquier filtro, cada
--                               una etiquetada con si esa fila especifica termino en el
--                               archivo limpio (was_kept_in_clean) y, si no, el motivo
--                               exacto (rejection_reason, mismos valores que la columna
--                               "categoria" de arriba). Es la version ampliada de "subir
--                               la base sucia": no los ~2.5M+ registros crudos completos
--                               (serian casi enteramente redundantes con lo que ya esta
--                               limpio), sino una muestra explorable y trazable.
--
-- Sin FK a risa_patients: son tablas de auditoria/log (igual que risa_alerts y
-- risa_ai_insights), no deben fallar un insert por un id que no calce perfecto.
-- =============================================================================

create table if not exists risa_etl_quality_audit (
  id              bigint generated always as identity primary key,
  stage           text not null,
  category        text not null,
  dropped_count   integer not null,
  created_at      timestamptz not null default now(),
  unique (stage, category)
);

create index if not exists risa_etl_audit_stage_idx on risa_etl_quality_audit (stage);

alter table risa_etl_quality_audit enable row level security;

drop policy if exists risa_etl_quality_audit_read on risa_etl_quality_audit;

create policy risa_etl_quality_audit_read
  on risa_etl_quality_audit for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------

create table if not exists risa_raw_data_sample (
  id                  bigint generated always as identity primary key,
  source_file         text not null,
  patient_id          text,
  device_id           text,
  variable_code       text not null,
  raw_timestamp       timestamptz,
  raw_value           text,
  unit                text,
  quality_flag        text,
  signal_quality      numeric,
  was_kept_in_clean   boolean not null,
  rejection_reason    text,
  created_at          timestamptz not null default now(),
  unique (source_file, patient_id, device_id, variable_code, raw_timestamp)
);

create index if not exists risa_raw_sample_source_idx  on risa_raw_data_sample (source_file);
create index if not exists risa_raw_sample_kept_idx    on risa_raw_data_sample (was_kept_in_clean);
create index if not exists risa_raw_sample_patient_idx on risa_raw_data_sample (patient_id);

alter table risa_raw_data_sample enable row level security;

drop policy if exists risa_raw_data_sample_read on risa_raw_data_sample;

create policy risa_raw_data_sample_read
  on risa_raw_data_sample for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- Verificacion
-- -----------------------------------------------------------------------------
-- select count(*) from risa_etl_quality_audit;  -- debe dar 0 justo despues de crear
-- select count(*) from risa_raw_data_sample;    -- debe dar 0 justo despues de crear
-- select tablename, rowsecurity from pg_tables
--   where tablename in ('risa_etl_quality_audit', 'risa_raw_data_sample');
