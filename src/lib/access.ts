// Matriz UI de roles (refleja role_permissions de la DB).
// La DB (triggers 007/021 + RLS) es la que realmente bloquea; esto solo oculta.
// employee = solo lectura (022): ve dashboard/horas/tickets/avisos/perfil, no escribe.
export const WRITE_ROLES = ["owner", "admin", "manager"];
export const AUDIT_ROLES = ["owner", "admin"];
export const ADMIN_ROLES = ["owner", "admin"];
// Módulos operativos (CRM/proyectos/documentos): solo gestión, no técnicos.
export const OPS_ROLES = ["owner", "admin", "manager"];

export function canWrite(role?: string | null): boolean {
  return !!role && WRITE_ROLES.includes(role);
}
export function canAudit(role?: string | null): boolean {
  return !!role && AUDIT_ROLES.includes(role);
}
export function isAdmin(role?: string | null): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}
export function canApprove(role?: string | null): boolean {
  return !!role && ["owner", "admin", "manager"].includes(role);
}
export function canComment(role?: string | null): boolean {
  return !!role && ["owner", "admin", "manager", "employee"].includes(role);
}
export function canOperate(role?: string | null): boolean {
  return !!role && OPS_ROLES.includes(role);
}
