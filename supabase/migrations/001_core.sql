-- 001_core: multi-tenant base. Revisar antes de aplicar a Supabase. NO aplicado.
create extension if not exists "pgcrypto";

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  nit text,
  plan text not null default 'internal',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key, -- = auth.users.id
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table organization_members (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  tenant_role text not null default 'employee'
    check (tenant_role in ('owner','admin','manager','employee','viewer')),
  platform_role text check (platform_role in ('super_admin','support_admin')),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table permissions ( code text primary key, description text );
insert into permissions(code) values
 ('crm.read'),('crm.write'),('time.read'),('time.write'),
 ('time.approve'),('audit.read'),('users.manage');

create table role_permissions (
  tenant_role text not null,
  permission text not null references permissions(code),
  primary key (tenant_role, permission)
);
insert into role_permissions values
 ('viewer','crm.read'),('viewer','time.read'),
 ('employee','crm.read'),('employee','crm.write'),('employee','time.read'),('employee','time.write'),
 ('manager','crm.read'),('manager','crm.write'),('manager','time.read'),('manager','time.write'),('manager','time.approve'),
 ('admin','crm.read'),('admin','crm.write'),('admin','time.read'),('admin','time.write'),('admin','time.approve'),('admin','users.manage'),
 ('owner','crm.read'),('owner','crm.write'),('owner','time.read'),('owner','time.write'),('owner','time.approve'),('owner','audit.read'),('owner','users.manage');

-- helpers RLS
create or replace function my_orgs() returns setof uuid
language sql stable security definer set search_path = public as $$
  select org_id from organization_members where user_id = auth.uid() and status='active'
$$;

create or replace function has_permission(p_org uuid, p_perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members m
    join role_permissions rp on rp.tenant_role = m.tenant_role
    where m.user_id = auth.uid() and m.org_id = p_org and m.status='active' and rp.permission = p_perm
  )
$$;

alter table organizations enable row level security;
alter table organizations force row level security;
create policy org_isolation on organizations for all using (id in (select my_orgs())) with check (id in (select my_orgs()));
