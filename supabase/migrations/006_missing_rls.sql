-- 006_missing_rls: policies faltantes (contacts/projects/tasks/...) (NO aplicado).
-- Causa del error: contacts tenía FORCE RLS sin policy => todo denegado.

alter table contacts enable row level security;
alter table contacts force row level security;
drop policy if exists contacts_iso on contacts;
create policy contacts_iso on contacts for all
  using (organization_id in (select my_orgs())) with check (organization_id in (select my_orgs()));

alter table projects enable row level security;
alter table projects force row level security;
drop policy if exists projects_iso on projects;
create policy projects_iso on projects for all
  using (organization_id in (select my_orgs())) with check (organization_id in (select my_orgs()));

alter table tasks enable row level security;
alter table tasks force row level security;
drop policy if exists tasks_iso on tasks;
create policy tasks_iso on tasks for all
  using (organization_id in (select my_orgs())) with check (organization_id in (select my_orgs()));

alter table profiles enable row level security;
alter table profiles force row level security;
drop policy if exists profiles_self on profiles;
create policy profiles_self on profiles for select using (id = auth.uid());
drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists profiles_org_read on profiles;
create policy profiles_org_read on profiles for select using (
  exists (select 1 from organization_members m1
    join organization_members m2 on m1.org_id = m2.org_id
    where m1.user_id = auth.uid() and m2.user_id = profiles.id));

alter table security_events enable row level security;
alter table security_events force row level security;
drop policy if exists seclock_insert on security_events;
create policy seclock_insert on security_events for insert with check (true);
drop policy if exists seclock_read on security_events;
create policy seclock_read on security_events for select using (
  organization_id is null or organization_id in (select my_orgs()));
