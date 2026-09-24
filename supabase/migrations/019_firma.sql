-- 019_firma: base de firma electrónica compatible con Documenso (NO aplicado).
-- Flujo: app crea signing_request (borrador) → se envía al proveedor (external_id)
-- → el proveedor notifica vía webhook → estado firmado. Sin rehacer nada después.
create table signing_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  provider text not null default 'documenso',
  external_id text,
  estado text not null default 'borrador'
    check (estado in ('borrador','enviado','firmado','rechazado','expirado')),
  firmantes jsonb not null default '[]',
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index signing_doc_idx on signing_requests(document_id);

alter table signing_requests enable row level security;
alter table signing_requests force row level security;
drop policy if exists signing_iso on signing_requests;
create policy signing_iso on signing_requests for all
  using (organization_id in (select my_orgs())) with check (organization_id in (select my_orgs()));

drop trigger if exists trg_signing_audit on signing_requests;
create trigger trg_signing_audit after insert or update or delete on signing_requests
for each row execute function log_audit();
