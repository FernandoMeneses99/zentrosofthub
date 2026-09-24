-- 005_member_rls: permitir a cada usuario leer sus propias membresías (NO aplicado).
alter table organization_members enable row level security;
alter table organization_members force row level security;
drop policy if exists members_self_read on organization_members;
create policy members_self_read on organization_members for select
  using (user_id = auth.uid());
drop policy if exists members_admin_write on organization_members;
create policy members_admin_write on organization_members for all
  using (has_permission(org_id, 'users.manage')) with check (has_permission(org_id, 'users.manage'));
