-- 004_audit_triggers: auditoría automática companies/contacts/time_entries (NO aplicado).
-- Ejecutar en SQL Editor. Append-only: la app solo lee (audit.read), escribe el trigger.
create or replace function log_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into audit_logs (organization_id, actor, accion, recurso, recurso_id, resultado, diff)
  values (
    coalesce((to_jsonb(NEW)->>'organization_id')::uuid, (to_jsonb(OLD)->>'organization_id')::uuid),
    auth.uid(), TG_OP, TG_TABLE_NAME,
    coalesce(to_jsonb(NEW)->>'id', to_jsonb(OLD)->>'id'),
    'ok', jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW))
  );
  return coalesce(NEW, OLD);
end $$;

drop trigger if exists trg_companies_audit on companies;
create trigger trg_companies_audit after insert or update or delete on companies
for each row execute function log_audit();

drop trigger if exists trg_contacts_audit on contacts;
create trigger trg_contacts_audit after insert or update or delete on contacts
for each row execute function log_audit();

drop trigger if exists trg_time_audit on time_entries;
create trigger trg_time_audit after insert or update or delete on time_entries
for each row execute function log_audit();

-- bloquear escritura directa desde app: solo el trigger/service_role escriben
-- (si ya hay policy de escritura en audit_logs para authenticated, elimínala;
--  audit_read SELECT ya existe en 002).
