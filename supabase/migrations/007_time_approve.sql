-- 007_time_approve: solo rol con time.approve puede cambiar estado/aprobación (NO aplicado).
-- Vía trigger (más preciso que policy): ediciones normales libres, cambio de estado restringido.
create or replace function guard_time_approval() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if OLD.estado is distinct from NEW.estado
     or OLD.approved_by is distinct from NEW.approved_by then
    if not has_permission(NEW.organization_id, 'time.approve') then
      raise exception 'Requiere permiso time.approve para aprobar horas';
    end if;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_guard_approval on time_entries;
create trigger trg_guard_approval before update on time_entries
for each row execute function guard_time_approval();
