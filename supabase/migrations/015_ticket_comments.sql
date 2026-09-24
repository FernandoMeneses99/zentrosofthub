-- 015_ticket_comments: conversación del ticket (NO aplicado).
-- Respuestas visibles al cliente vs notas internas del equipo.
create table ticket_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  ticket_id uuid not null references tickets(id) on delete cascade,
  autor uuid references profiles(id),
  cuerpo text not null check (char_length(cuerpo) between 1 and 5000),
  es_interna boolean not null default false,
  created_at timestamptz not null default now()
);
create index ticket_comments_ticket_idx on ticket_comments(ticket_id, created_at);

alter table ticket_comments enable row level security;
alter table ticket_comments force row level security;
drop policy if exists tcomments_iso on ticket_comments;
create policy tcomments_iso on ticket_comments for all
  using (organization_id in (select my_orgs())) with check (organization_id in (select my_orgs()));
