-- 018_documents: módulo mínimo de documentos (NO aplicado).
-- Base para contratos y firma electrónica. Bucket privado, acceso por signed URLs.
insert into storage.buckets (id, name, public) values ('documentos', 'documentos', false)
on conflict (id) do nothing;

create table documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_id uuid references companies(id),
  ticket_id uuid references tickets(id),
  nombre text not null,
  storage_path text not null,
  mime text, size_bytes int,
  categoria text not null default 'general' check (categoria in ('general','contrato','factura','evidencia','otro')),
  created_by uuid, created_at timestamptz not null default now()
);
create index documents_org_idx on documents(organization_id);

alter table documents enable row level security;
alter table documents force row level security;
drop policy if exists documents_iso on documents;
create policy documents_iso on documents for all
  using (organization_id in (select my_orgs())) with check (organization_id in (select my_orgs()));

-- Storage: solo miembros del tenant, rutas org/<org_id>/...
drop policy if exists stor_read on storage.objects;
create policy stor_read on storage.objects for select using (
  bucket_id = 'documentos' and (storage.foldername(name))[1] = 'org'
  and (storage.foldername(name))[2] in (select my_orgs()::text));
drop policy if exists stor_write on storage.objects;
create policy stor_write on storage.objects for insert with check (
  bucket_id = 'documentos' and (storage.foldername(name))[1] = 'org'
  and (storage.foldername(name))[2] in (select my_orgs()::text));
drop policy if exists stor_delete on storage.objects;
create policy stor_delete on storage.objects for delete using (
  bucket_id = 'documentos' and (storage.foldername(name))[1] = 'org'
  and (storage.foldername(name))[2] in (select my_orgs()::text));

drop trigger if exists trg_documents_audit on documents;
create trigger trg_documents_audit after insert or update or delete on documents
for each row execute function log_audit();
