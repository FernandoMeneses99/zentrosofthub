-- 020_grants_fix: service_role también necesita GRANTs explícitos (NO aplicado).
-- Causa del error "permiso denegado para organization_members": service_role
-- bypassea RLS pero igual requiere privilegios de tabla, y la 003 solo
-- cubrió a authenticated para las tablas existentes en ese momento.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to authenticated, service_role;
grant all on all sequences in schema public to authenticated, service_role;
alter default privileges in schema public
  grant all on tables to authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to authenticated, service_role;
