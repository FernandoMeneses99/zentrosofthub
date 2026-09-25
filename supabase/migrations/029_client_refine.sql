-- 029_client_refine: refino del rol cliente (NO aplicado).
-- 1) rating al cerrar:
alter table tickets add column if not exists rating int check (rating between 1 and 5);

-- 2) clientes jamás ven notas internas:
drop policy if exists tcomments_client on ticket_comments;
create policy tcomments_client on ticket_comments for select
  using (not es_interna
    and ticket_id in (select t.id from tickets t where t.created_by = auth.uid()));

-- 3) horas: staff igual; clientes solo las de su empresa (transparencia del plan).
drop policy if exists time_iso on time_entries;
create policy time_staff on time_entries for all
  using (organization_id in (select my_orgs()) and not is_client())
  with check (organization_id in (select my_orgs()) and not is_client());
drop policy if exists time_client on time_entries;
create policy time_client on time_entries for select
  using (company_id in (select my_company_ids()));

-- 4) KB: clientes solo artículos etiquetados 'anuncio'.
drop policy if exists kb_read on kb_articles;
create policy kb_read on kb_articles for select
  using (organization_id in (select my_orgs()) and not is_client());
drop policy if exists kb_client on kb_articles;
create policy kb_client on kb_articles for select
  using (organization_id in (select my_orgs()) and tags @> array['anuncio']);

-- 5) adjuntos del cliente: puede subir evidencia y registrarla en sus tickets.
create or replace function guard_documents() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if has_permission(coalesce((to_jsonb(NEW)->>'organization_id')::uuid,
      (to_jsonb(OLD)->>'organization_id')::uuid), 'crm.write') then
    return coalesce(NEW, OLD);
  end if;
  if is_client() and TG_OP = 'INSERT'
    and (NEW.ticket_id is not null)
    and exists (select 1 from tickets t where t.id = NEW.ticket_id and t.created_by = auth.uid()) then
    return NEW;
  end if;
  raise exception 'Requiere permiso crm.write para modificar documents';
end $$;

drop trigger if exists trg_w_documents on documents;
create trigger trg_w_documents before insert or update or delete on documents
for each row execute function guard_documents();

drop policy if exists stor_client_upload on storage.objects;
create policy stor_client_upload on storage.objects for insert with check (
  bucket_id = 'documentos' and (storage.foldername(name))[1] = 'org'
  and (storage.foldername(name))[2] in (select my_orgs()::text)
  and is_client());
