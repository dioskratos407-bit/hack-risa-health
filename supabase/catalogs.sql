-- =============================================================================
-- RISA - Catalogos de referencia
-- (data_dictionary.csv, source_catalog.csv, units_catalog.csv, variable_catalog.csv)
-- =============================================================================
-- Ejecutar en el SQL Editor de Supabase. No dependen de risa_patients ni de
-- ninguna tabla clinica -- son catalogos que describen el modelo de datos en
-- si mismo (que significa cada variable, cada unidad, cada fuente).
--
-- Orden dentro de este script: risa_units_catalog primero (tiene una FK a si
-- misma via canonical_unit), despues risa_variable_catalog (FK a
-- risa_units_catalog), despues risa_source_catalog y risa_data_dictionary
-- (sin dependencias).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) risa_units_catalog  (units_catalog.csv)
-- -----------------------------------------------------------------------------
-- canonical_unit referencia a si misma (ej. degF -> degC): toda unidad se
-- normaliza a otra unidad que tambien vive en este catalogo.
create table if not exists risa_units_catalog (
  unit_code           text primary key,
  unit_name           text not null,
  dimension           text not null,
  canonical_unit      text not null references risa_units_catalog (unit_code),
  conversion_factor   numeric not null,
  conversion_offset   numeric not null
);

alter table risa_units_catalog enable row level security;
drop policy if exists risa_units_catalog_read on risa_units_catalog;
create policy risa_units_catalog_read
  on risa_units_catalog for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- 2) risa_variable_catalog  (variable_catalog.csv)
-- -----------------------------------------------------------------------------
-- canonical_unit -> risa_units_catalog: cada variable (HR, LAB_A, etc.) declara
-- en que unidad se mide, y esa unidad tiene que existir en el catalogo de
-- unidades. plausibility_min/max van nulos para variables categoricas
-- (ACTIVITY_LEVEL, SLEEP_STATE) porque el CSV de origen las trae vacias.
create table if not exists risa_variable_catalog (
  variable_code      text primary key,
  variable_name      text not null,
  domain             text not null,
  canonical_unit     text not null references risa_units_catalog (unit_code),
  plausibility_min   numeric,
  plausibility_max   numeric,
  nominal_sampling   text,
  analysis_role      text not null
);

create index if not exists risa_variable_catalog_domain_idx on risa_variable_catalog (domain);

alter table risa_variable_catalog enable row level security;
drop policy if exists risa_variable_catalog_read on risa_variable_catalog;
create policy risa_variable_catalog_read
  on risa_variable_catalog for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- 3) risa_source_catalog  (source_catalog.csv)
-- -----------------------------------------------------------------------------
-- Cada risa_* clinica que ya subiste tiene una columna source_system (o
-- "source", en risa_patient_context) cuyos valores vienen de aqui:
-- EHR_CORE, EHR_MED, LAB_SYS_A, LAB_SYS_B, MONITOR_GATEWAY,
-- MONITOR_RETRANSMIT, WEARABLE_GATEWAY. No se agrega la FK real en esas
-- tablas por defecto (ver bloque OPCIONAL al final) para no arriesgar un
-- error si algun valor ya cargado no calza exacto.
create table if not exists risa_source_catalog (
  source_system            text primary key,
  source_name              text not null,
  source_type              text not null,
  update_frequency         text not null,
  interoperability_level   text not null,
  typical_latency          text not null,
  description              text not null
);

alter table risa_source_catalog enable row level security;
drop policy if exists risa_source_catalog_read on risa_source_catalog;
create policy risa_source_catalog_read
  on risa_source_catalog for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- 4) risa_data_dictionary  (data_dictionary.csv)
-- -----------------------------------------------------------------------------
-- Documentacion campo por campo de los CSV de origen. No tiene un id propio
-- en el archivo -- la combinacion (file, field) es la llave natural.
create table if not exists risa_data_dictionary (
  file          text not null,
  field         text not null,
  type          text not null,
  key_role      text,
  description   text not null,
  primary key (file, field)
);

create index if not exists risa_data_dictionary_field_idx on risa_data_dictionary (field);

alter table risa_data_dictionary enable row level security;
drop policy if exists risa_data_dictionary_read on risa_data_dictionary;
create policy risa_data_dictionary_read
  on risa_data_dictionary for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- OPCIONAL -- enlazar de verdad las tablas clinicas ya cargadas a estos
-- catalogos. Comentado por defecto: solo corre esto DESPUES de importar los
-- 4 CSV de arriba, y solo si quieres que Postgres rechace en el futuro
-- cualquier fila con un source_system/unit/test_code que no exista en el
-- catalogo correspondiente.
-- -----------------------------------------------------------------------------
-- alter table risa_encounters
--   add constraint risa_encounters_source_fk
--   foreign key (source_system) references risa_source_catalog (source_system);
--
-- alter table risa_conditions
--   add constraint risa_conditions_source_fk
--   foreign key (source_system) references risa_source_catalog (source_system);
--
-- alter table risa_laboratory_results
--   add constraint risa_lab_results_source_fk
--   foreign key (source_system) references risa_source_catalog (source_system);
--
-- alter table risa_laboratory_results
--   add constraint risa_lab_results_unit_fk
--   foreign key (unit) references risa_units_catalog (unit_code);
--
-- alter table risa_laboratory_results
--   add constraint risa_lab_results_test_code_fk
--   foreign key (test_code) references risa_variable_catalog (variable_code);
--
-- alter table risa_medication_administrations
--   add constraint risa_med_admin_source_fk
--   foreign key (source_system) references risa_source_catalog (source_system);
--
-- alter table risa_patient_context
--   add constraint risa_patient_context_source_fk
--   foreign key (source) references risa_source_catalog (source_system);

-- -----------------------------------------------------------------------------
-- Verificacion
-- -----------------------------------------------------------------------------
-- select count(*) from risa_units_catalog;      -- debe dar 13
-- select count(*) from risa_variable_catalog;    -- debe dar 15
-- select count(*) from risa_source_catalog;      -- debe dar 7
-- select count(*) from risa_data_dictionary;     -- debe dar 11 (segun tu muestra)
