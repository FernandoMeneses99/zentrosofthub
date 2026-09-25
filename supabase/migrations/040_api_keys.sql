-- 040_api_keys: claves API por organización para integraciones (NO aplicado).
-- Se guarda solo el hash SHA256; el valor se muestra una vez al crear.
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  nombre text not null,
  hash text not null,
  prefijo text not null,
  created_by uuid, created_at timestamptz not null default now(),
  revoked_at timestamptz
);
alter table api_keys enable row level security;
alter table api_keys force row level security;
drop policy if exists akey_read on api_keys;
create policy akey_read on api_keys for select
  using (organization_id in (select my_orgs()) and not is_client());
drop policy if exists akey_write on api_keys;
create policy akey_write on api_keys for all
  using (has_permission(organization_id, 'users.manage'))
  with check (has_permission(organization_id, 'users.manage'));
