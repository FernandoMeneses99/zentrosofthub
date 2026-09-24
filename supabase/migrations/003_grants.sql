-- 003_grants: conceder acceso PostgREST a rol authenticated (NO aplicado).
-- Ejecutar en SQL Editor como postgres.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
-- anon sin acceso a tablas de negocio (solo Auth usa anon); no conceder.
