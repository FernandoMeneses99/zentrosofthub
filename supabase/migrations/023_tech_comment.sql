-- 023_tech_comment: técnicos pueden comentar tickets, nada más (NO aplicado).
-- Permiso granular nuevo para no devolverles escritura general.
insert into permissions(code) values ('ticket.comment') on conflict do nothing;
insert into role_permissions values
  ('owner','ticket.comment'), ('admin','ticket.comment'),
  ('manager','ticket.comment'), ('employee','ticket.comment')
on conflict do nothing;

-- comentarios exigen ticket.comment en vez de crm.write:
-- (la función acepta el permiso literal cuando no es 'time' ni 'crm').
create or replace function guard_write_perm() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_perm text;
begin
  v_org := coalesce(
    (to_jsonb(NEW)->>'organization_id')::uuid,
    (to_jsonb(OLD)->>'organization_id')::uuid,
    (to_jsonb(NEW)->>'org_id')::uuid,
    (to_jsonb(OLD)->>'org_id')::uuid);
  v_perm := case TG_ARGV[0]
    when 'time' then 'time.write'
    when 'crm' then 'crm.write'
    else TG_ARGV[0] end;
  if not has_permission(v_org, v_perm) then
    raise exception 'Requiere permiso % para modificar %', v_perm, TG_TABLE_NAME;
  end if;
  return coalesce(NEW, OLD);
end $$;

drop trigger if exists trg_w_tcomments on ticket_comments;
create trigger trg_w_tcomments before insert or update or delete on ticket_comments
for each row execute function guard_write_perm('ticket.comment');
