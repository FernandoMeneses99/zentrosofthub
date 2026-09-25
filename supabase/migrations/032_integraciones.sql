-- 032_integraciones: configuración de integraciones por organización (NO aplicado).
-- Guarda tokens de bots/canales sin tocar variables de entorno.
create table integraciones (
  organization_id uuid not null references organizations(id) on delete cascade,
  provider text not null check (provider in ('telegram','documenso','github','resend')),
  config jsonb not null default '{}',
  activo boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (organization_id, provider)
);

alter table integraciones enable row level security;
alter table integraciones force row level security;
drop policy if exists integ_read on integraciones;
create policy integ_read on integraciones for select
  using (organization_id in (select my_orgs()));
drop policy if exists integ_write on integraciones;
create policy integ_write on integraciones for all
  using (has_permission(organization_id, 'users.manage'))
  with check (has_permission(organization_id, 'users.manage'));
