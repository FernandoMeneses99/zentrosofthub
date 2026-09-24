-- isolation_test.sql: prueba de aislamiento cross-tenant (NO aplicado).
-- Pasos: 1) crear 2º usuario vía /login con otro email. 2) pegar su UUID abajo.
-- 3) ejecutar. 4) iniciar sesión como ese usuario y verificar que NO ve nada de zentrosoft
--    y que aprobar una hora ajena falla con 'Requiere permiso time.approve'.

-- Segundo tenant de prueba:
insert into organizations (name, slug, plan, status)
values ('Tenant Prueba', 'tenant-prueba', 'internal', 'active')
on conflict (slug) do nothing;

-- Membresía employee del 2º usuario (REEMPLAZAR UUID):
-- insert into organization_members (org_id, user_id, tenant_role, status)
-- select o.id, 'PEGAR-UUID-SEGUNDO-USUARIO', 'employee', 'active'
-- from organizations o where o.slug = 'tenant-prueba'
-- on conflict do nothing;

-- Verificación como owner (debe dar 1 fila): empresas visibles por tenant.
-- select slug, count(*) from organizations o
-- join companies c on c.organization_id = o.id group by slug;
