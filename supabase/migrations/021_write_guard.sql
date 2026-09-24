-- 021_write_guard: solo roles con permiso de escritura modifican datos (NO aplicado).
-- Cierra el hueco: viewers podían escribir vía RLS permisiva. Tablas CRM/proyectos/
-- documentos/tickets exigen crm.write; time_entries exige time.write.
create or replace function guard_write_perm() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_perm text;
begin
  v_org := coalesce(
    (to_jsonb(NEW)->>'organization_id')::uuid,
    (to_jsonb(OLD)->>'organization_id')::uuid,
    (to_jsonb(NEW)->>'org_id')::uuid,
    (to_jsonb(OLD)->>'org_id')::uuid);
  v_perm := case TG_ARGV[0] when 'time' then 'time.write' else 'crm.write' end;
  if not has_permission(v_org, v_perm) then
    raise exception 'Requiere permiso % para modificar %', v_perm, TG_TABLE_NAME;
  end if;
  return coalesce(NEW, OLD);
end $$;

-- CRM / proyectos / documentos / tickets / firma → crm.write
drop trigger if exists trg_w_companies on companies;
create trigger trg_w_companies before insert or update or delete on companies
for each row execute function guard_write_perm('crm');
drop trigger if exists trg_w_contacts on contacts;
create trigger trg_w_contacts before insert or update or delete on contacts
for each row execute function guard_write_perm('crm');
drop trigger if exists trg_w_projects on projects;
create trigger trg_w_projects before insert or update or delete on projects
for each row execute function guard_write_perm('crm');
drop trigger if exists trg_w_tasks on tasks;
create trigger trg_w_tasks before insert or update or delete on tasks
for each row execute function guard_write_perm('crm');
drop trigger if exists trg_w_tickets on tickets;
create trigger trg_w_tickets before insert or update or delete on tickets
for each row execute function guard_write_perm('crm');
drop trigger if exists trg_w_tcomments on ticket_comments;
create trigger trg_w_tcomments before insert or update or delete on ticket_comments
for each row execute function guard_write_perm('crm');
drop trigger if exists trg_w_documents on documents;
create trigger trg_w_documents before insert or update or delete on documents
for each row execute function guard_write_perm('crm');
drop trigger if exists trg_w_signing on signing_requests;
create trigger trg_w_signing before insert or update or delete on signing_requests
for each row execute function guard_write_perm('crm');

-- horas → time.write
drop trigger if exists trg_w_time on time_entries;
create trigger trg_w_time before insert or update or delete on time_entries
for each row execute function guard_write_perm('time');

-- Storage: subir/borrar exige crm.write (los viewers solo descargan).
drop policy if exists stor_write on storage.objects;
create policy stor_write on storage.objects for insert with check (
  bucket_id = 'documentos' and (storage.foldername(name))[1] = 'org'
  and (storage.foldername(name))[2] in (select my_orgs()::text)
  and has_permission(((storage.foldername(name))[2])::uuid, 'crm.write'));
drop policy if exists stor_delete on storage.objects;
create policy stor_delete on storage.objects for delete using (
  bucket_id = 'documentos' and (storage.foldername(name))[1] = 'org'
  and (storage.foldername(name))[2] in (select my_orgs()::text)
  and has_permission(((storage.foldername(name))[2])::uuid, 'crm.write'));
