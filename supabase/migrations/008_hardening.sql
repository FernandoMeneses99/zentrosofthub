-- 008_hardening: endurecimiento F1 (NO aplicado — ejecutar en SQL Editor).
-- 1) security_events: INSERT solo propio, SELECT owner/admin.
drop policy if exists seclock_insert on security_events;
create policy seclock_insert on security_events for insert with check (
  (organization_id is null and (detalle->>'email') = (auth.jwt()->>'email'))
  or (organization_id in (select my_orgs()))
);
drop policy if exists seclock_read on security_events;
create policy seclock_read on security_events for select using (
  organization_id is null
  or has_permission(organization_id, 'users.manage')
  or has_permission(organization_id, 'audit.read')
);

-- 2) audit.read también para admin.
insert into role_permissions values ('admin','audit.read')
on conflict do nothing;

-- 3) hash encadenado tamper-evident por organización.
create or replace function chain_audit_hash() returns trigger
language plpgsql security definer set search_path = public as $$
declare prev text;
begin
  select hash into prev from audit_logs
  where organization_id is not distinct from NEW.organization_id
  order by id desc limit 1;
  NEW.prev_hash := prev;
  NEW.hash := encode(digest(
    coalesce(prev,'GENESIS') || '|' || coalesce(NEW.accion,'') || '|' ||
    coalesce(NEW.recurso,'') || '|' || coalesce(NEW.recurso_id,'') || '|' ||
    coalesce(NEW.actor::text,'') || '|' || coalesce(NEW.diff::text,''),
    'sha256'), 'hex');
  return NEW;
end $$;

drop trigger if exists trg_chain_hash on audit_logs;
create trigger trg_chain_hash before insert on audit_logs
for each row execute function chain_audit_hash();
