-- 036_vinculo_guard: permite auto-vinculación inicial del contacto (NO aplicado).
-- El guard 034 impedía que vincular_mi_contacto() asignara user_id.
create or replace function guard_contact_self() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_client() then
    -- Auto-vínculo: reclamar un contacto sin dueño siendo tú mismo está permitido.
    if OLD.user_id is null and NEW.user_id = auth.uid()
      and NEW.organization_id is not distinct from OLD.organization_id
      and NEW.company_id is not distinct from OLD.company_id
      and NEW.nombre is not distinct from OLD.nombre
      and NEW.email is not distinct from OLD.email then
      return NEW;
    end if;
    if NEW.user_id is distinct from OLD.user_id
      or NEW.organization_id is distinct from OLD.organization_id
      or NEW.company_id is distinct from OLD.company_id
      or NEW.nombre is distinct from OLD.nombre
      or NEW.email is distinct from OLD.email then
      raise exception 'Solo puedes actualizar tu Telegram';
    end if;
  end if;
  return NEW;
end $$;
