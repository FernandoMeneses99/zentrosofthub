-- bootstrap_owner.sql: crear org Zentrosoft + perfil + membership owner (NO aplicado).
-- Reemplazar el email por el real del usuario owner. Ejecutar en SQL Editor.
-- El user_id ya existe en auth.users (proveído por el cliente).

insert into organizations (id, name, slug, nit, plan, status)
values (gen_random_uuid(), 'Zentrosoft', 'zentrosoft', null, 'internal', 'active')
on conflict (slug) do nothing;

insert into profiles (id, display_name)
values ('93df50c9-5c98-4a5a-a784-aa84d3b5c233', 'Owner Zentrosoft')
on conflict (id) do update set display_name = excluded.display_name;

insert into organization_members (org_id, user_id, tenant_role, status)
select o.id, '93df50c9-5c98-4a5a-a784-aa84d3b5c233', 'owner', 'active'
from organizations o where o.slug = 'zentrosoft'
on conflict (org_id, user_id) do update set tenant_role = 'owner', status = 'active';
