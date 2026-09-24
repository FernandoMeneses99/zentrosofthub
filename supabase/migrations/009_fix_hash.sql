-- 009_fix_hash: digest vive en esquema extensions en Supabase (NO aplicado).
create extension if not exists "pgcrypto" with schema extensions;

create or replace function chain_audit_hash() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare prev text;
begin
  select hash into prev from audit_logs
  where organization_id is not distinct from NEW.organization_id
  order by id desc limit 1;
  NEW.prev_hash := prev;
  NEW.hash := encode(extensions.digest(
    coalesce(prev,'GENESIS') || '|' || coalesce(NEW.accion,'') || '|' ||
    coalesce(NEW.recurso,'') || '|' || coalesce(NEW.recurso_id,'') || '|' ||
    coalesce(NEW.actor::text,'') || '|' || coalesce(NEW.diff::text,''),
    'sha256'), 'hex');
  return NEW;
end $$;
