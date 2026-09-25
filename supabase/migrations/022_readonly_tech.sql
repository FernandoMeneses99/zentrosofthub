-- 022_readonly_tech: técnicos (employee) en solo lectura (NO aplicado).
-- Decisión de negocio: el técnico solo ve. Escribir/aprobar queda para
-- manager/admin/owner. Los triggers 007/021 aplican esto automáticamente.
delete from role_permissions where tenant_role = 'employee' and permission in ('crm.write', 'time.write');
-- employee conserva: crm.read, time.read.
