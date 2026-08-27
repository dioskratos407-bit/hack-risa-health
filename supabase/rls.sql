-- =============================================================================
-- RISA - Row Level Security
-- =============================================================================
-- Ejecutar una vez en el SQL Editor de Supabase.
--
-- POR QUÉ: sin RLS, la clave anónima concede lectura, escritura Y BORRADO sobre
-- todas las tablas. Se verificó empíricamente: con esa clave se pudo insertar y
-- borrar filas de risa_alerts sin ninguna restricción.
--
-- QUÉ HACE: activa RLS y deja a la clave anónima únicamente con SELECT. Toda
-- escritura pasa a exigir la clave de service_role, que solo vive en el servidor
-- (variable SUPABASE_SERVICE_ROLE_KEY, sin prefijo NEXT_PUBLIC_, de modo que
-- Next.js no puede incluirla en el bundle del navegador).
--
-- IMPORTANTE: service_role ignora RLS por diseño. Antes de ejecutar esto, añade
-- a .env.local:
--     SUPABASE_SERVICE_ROLE_KEY=<clave service_role del proyecto>
-- Si no la añades, las escrituras del prototipo empezarán a fallar con 401.
-- =============================================================================

alter table risa_master_data  enable row level security;
alter table risa_alerts       enable row level security;
alter table risa_ai_insights  enable row level security;

-- Idempotente: permite reejecutar el script sin error.
drop policy if exists risa_master_data_read on risa_master_data;
drop policy if exists risa_alerts_read      on risa_alerts;
drop policy if exists risa_ai_insights_read on risa_ai_insights;

-- Solo lectura para la clave anónima. No se crean políticas de INSERT/UPDATE/
-- DELETE: sin política que las permita, RLS las bloquea por defecto.
create policy risa_master_data_read
  on risa_master_data for select
  to anon, authenticated
  using (true);

create policy risa_alerts_read
  on risa_alerts for select
  to anon, authenticated
  using (true);

create policy risa_ai_insights_read
  on risa_ai_insights for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- Verificación: rowsecurity debe ser true en las tres tablas.
-- -----------------------------------------------------------------------------
-- select tablename, rowsecurity
--   from pg_tables
--  where schemaname = 'public'
--    and tablename in ('risa_master_data', 'risa_alerts', 'risa_ai_insights');
