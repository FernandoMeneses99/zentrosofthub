-- 025_kb: base de conocimiento interna (NO aplicado).
-- Prepara RAG futuro (columna embedding reservada, sin extensión aún).
create table kb_articles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  titulo text not null check (char_length(titulo) between 3 and 200),
  contenido text not null,
  tags text[] not null default '{}',
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index kb_org_idx on kb_articles(organization_id);
create index kb_titulo_trgm_idx on kb_articles using gin (titulo extensions.gin_trgm_ops);

alter table kb_articles enable row level security;
alter table kb_articles force row level security;
drop policy if exists kb_read on kb_articles;
create policy kb_read on kb_articles for select
  using (organization_id in (select my_orgs()));
drop policy if exists kb_write on kb_articles;
create policy kb_write on kb_articles for all
  using (has_permission(organization_id, 'crm.write'))
  with check (has_permission(organization_id, 'crm.write'));
