-- 010_constraints: validación a nivel DB (defensa en profundidad, NO aplicado).
-- La UI valida con Zod; esto impide datos inválidos aunque se bypassée el cliente.
alter table contacts drop constraint if exists contacts_rol_check;
alter table contacts add constraint contacts_rol_check check (
  rol_cliente in ('administrador','tecnico','finanzas','gerente','comercial','usuario_final','lectura'));
alter table contacts drop constraint if exists contacts_estado_check;
alter table contacts add constraint contacts_estado_check check (
  estado in ('activo','inactivo','potencial'));
alter table companies drop constraint if exists companies_estado_check;
alter table companies add constraint companies_estado_check check (
  estado in ('activa','inactiva','potencial'));
alter table time_entries drop constraint if exists time_estado_check;
alter table time_entries add constraint time_estado_check check (
  estado in ('borrador','enviado','aprobado','rechazado'));
alter table organization_members drop constraint if exists members_status_check;
alter table organization_members add constraint members_status_check check (
  status in ('active','suspended','removed'));
