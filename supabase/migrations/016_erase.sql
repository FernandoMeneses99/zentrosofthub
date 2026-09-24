-- 016_erase: anonimización de contactos Ley 1581 (NO aplicado).
-- Solo owner/admin (users.manage). Conserva agregados facturables, borra PII.
create or replace function erase_contact(p_org uuid, p_contact uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not has_permission(p_org, 'users.manage') then
    raise exception 'Requiere permiso users.manage';
  end if;
  update contacts set
    nombre = 'Eliminado', apellido = null, email = null, telefono = null,
    cargo = null, notas = null, deleted_at = now()
  where id = p_contact and organization_id = p_org;
  insert into audit_logs (organization_id, actor, accion, recurso, recurso_id, resultado)
  values (p_org, auth.uid(), 'DELETE', 'contacts', p_contact::text, 'anonimizado-ley1581');
end $$;
