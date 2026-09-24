-- 011_tickets: módulo mínimo de tickets/soporte (NO aplicado).
-- Anticipa portal cliente, SLA, comentarios y KB sin rehacer el esquema.
create table tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_id uuid references companies(id),
  contact_id uuid references contacts(id),
  titulo text not null check (char_length(titulo) between 3 and 200),
  descripcion text,
  estado text not null default 'abierto' check (estado in ('abierto','en_proceso','pendiente','cerrado')),
  prioridad text not null default 'media' check (prioridad in ('baja','media','alta','urgente')),
  asignado_a uuid references profiles(id),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);
create index tickets_org_estado_idx on tickets(organization_id, estado);

alter table tickets enable row level security;
alter table tickets force row level security;
drop policy if exists tickets_iso on tickets;
create policy tickets_iso on tickets for all
  using (organization_id in (select my_orgs())) with check (organization_id in (select my_orgs()));

drop trigger if exists trg_tickets_audit on tickets;
create trigger trg_tickets_audit after insert or update or delete on tickets
for each row execute function log_audit();
