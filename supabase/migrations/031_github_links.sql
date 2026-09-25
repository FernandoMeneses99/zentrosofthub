-- 031_github_links: vincular commits/PRs al ticket (NO aplicado).
-- El commit se hace en el repo del CLIENTE; aquí solo se registra el enlace.
create table ticket_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  ticket_id uuid not null references tickets(id) on delete cascade,
  tipo text not null check (tipo in ('commit','pr','rama','otro')),
  url text not null,
  ref text,
  created_by uuid, created_at timestamptz not null default now()
);
create index ticket_links_ticket_idx on ticket_links(ticket_id);

alter table ticket_links enable row level security;
alter table ticket_links force row level security;
drop policy if exists tlinks_read on ticket_links;
create policy tlinks_read on ticket_links for select
  using (organization_id in (select my_orgs()) and not is_client());
drop policy if exists tlinks_write on ticket_links;
create policy tlinks_write on ticket_links for all
  using (has_permission(organization_id, 'crm.write'))
  with check (has_permission(organization_id, 'crm.write'));
