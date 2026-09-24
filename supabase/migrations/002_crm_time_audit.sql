-- 002: CRM + time + auditoría. Revisar antes de aplicar. NO aplicado.
create table companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  razon_social text not null, nombre_comercial text, nit text,
  tipo text, industria text, direccion text, ciudad text, pais text default 'Colombia',
  telefono text, email text, website text,
  estado text not null default 'activa', notas text, metadata jsonb not null default '{}',
  created_by uuid, created_at timestamptz default now(), updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique (organization_id, nit)
);
create index companies_org_idx on companies(organization_id);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_id uuid references companies(id) on delete restrict,
  nombre text not null, apellido text, email text, telefono text, cargo text,
  rol_cliente text not null default 'usuario_final',
  estado text not null default 'activo', notas text,
  created_at timestamptz default now(), updated_at timestamptz default now(), deleted_at timestamptz
);
create index contacts_org_idx on contacts(organization_id);

create table projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_id uuid references companies(id),
  nombre text not null, estado text default 'activo',
  created_at timestamptz default now()
);
create table tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  titulo text not null, estado text default 'pendiente'
);

create table time_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id),
  company_id uuid references companies(id), project_id uuid references projects(id),
  task_id uuid references tasks(id), ticket_id uuid,
  fecha date not null, started_at timestamptz, ended_at timestamptz,
  duration_min int generated always as (greatest(0, round(extract(epoch from (ended_at-started_at))/60))) stored,
  descripcion text, tipo text default 'desarrollo',
  billable boolean default true, rate numeric(12,2),
  estado text default 'borrador', approved_by uuid, approved_at timestamptz,
  created_at timestamptz default now()
);
create index time_org_fecha_idx on time_entries(organization_id, fecha);

create table audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references organizations(id),
  actor uuid, accion text not null, recurso text not null, recurso_id text,
  at timestamptz default now(), ip text, user_agent text, resultado text,
  diff jsonb, prev_hash text, hash text
);
create table security_events (
  id bigint generated always as identity primary key,
  organization_id uuid references organizations(id),
  tipo text not null, severidad text not null, detalle jsonb, at timestamptz default now()
);
create table ai_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  user_id uuid, tarea text not null, modelo text,
  prompt_hash text, tokens int, costo numeric(10,4), estado text, created_at timestamptz default now()
);

-- RLS: ejemplo time_entries (replicar por tabla)
alter table companies enable row level security; alter table companies force row level security;
create policy companies_iso on companies for all
  using (organization_id in (select my_orgs())) with check (organization_id in (select my_orgs()));
alter table time_entries enable row level security; alter table time_entries force row level security;
create policy time_iso on time_entries for all
  using (organization_id in (select my_orgs())) with check (organization_id in (select my_orgs()));
alter table audit_logs enable row level security; alter table audit_logs force row level security;
create policy audit_read on audit_logs for select using (
  organization_id in (select my_orgs()) and has_permission(organization_id,'audit.read'));
