-- 038_saved_filters: filtros guardados por usuario (NO aplicado).
create table saved_filters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 2 and 60),
  filtros jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id, nombre)
);
alter table saved_filters enable row level security;
alter table saved_filters force row level security;
drop policy if exists sfilter_own on saved_filters;
create policy sfilter_own on saved_filters for all
  using (user_id = auth.uid() and organization_id in (select my_orgs()))
  with check (user_id = auth.uid() and organization_id in (select my_orgs()));
