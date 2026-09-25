-- 037_servicedesk: ciclo de vida profesional (NO aplicado).
-- 1) nuevo estado 'resuelto' (resuelto por staff, cerrado por/para el cliente):
alter table tickets drop constraint if exists tickets_estado_check;
alter table tickets add constraint tickets_estado_check check (
  estado in ('abierto','en_proceso','pendiente','resuelto','cerrado'));

-- 2) categorías:
alter table tickets add column if not exists categoria text
  check (categoria in ('soporte','incidencia','solicitud','mantenimiento','otro'));
-- 3) primera respuesta:
alter table tickets add column if not exists primera_respuesta_at timestamptz;
alter table sla_policies add column if not exists primera_horas int;

-- 4) transiciones permitidas (reapertura controlada y auditada):
create or replace function guard_transicion() returns trigger
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  if OLD.estado is not distinct from NEW.estado then return NEW; end if;
  ok := (OLD.estado, NEW.estado) in (
    ('abierto','en_proceso'), ('abierto','pendiente'), ('abierto','resuelto'), ('abierto','cerrado'),
    ('pendiente','abierto'), ('pendiente','en_proceso'), ('pendiente','resuelto'),
    ('en_proceso','pendiente'), ('en_proceso','resuelto'), ('en_proceso','cerrado'),
    ('resuelto','cerrado'), ('resuelto','abierto'),
    ('cerrado','abierto'));
  if not ok then
    raise exception 'Transición % → % no permitida', OLD.estado, NEW.estado;
  end if;
  -- reapertura desde cerrado solo staff:
  if OLD.estado = 'cerrado' and NEW.estado = 'abierto' and is_client() then
    raise exception 'Solo el equipo puede reabrir un caso';
  end if;
  if NEW.estado = 'cerrado' then NEW.closed_at := coalesce(NEW.closed_at, now()); end if;
  return NEW;
end $$;

drop trigger if exists trg_transicion on tickets;
create trigger trg_transicion before update on tickets
for each row execute function guard_transicion();

-- 5) primera respuesta = primer comentario del equipo (no interna? sí cuenta):
create or replace function mark_primera_respuesta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_client() then
    update tickets set primera_respuesta_at = coalesce(primera_respuesta_at, now())
    where id = NEW.ticket_id and primera_respuesta_at is null;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_primera_resp on ticket_comments;
create trigger trg_primera_resp after insert on ticket_comments
for each row execute function mark_primera_respuesta();

-- 6) plantillas de respuesta:
create table response_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  titulo text not null, cuerpo text not null,
  created_at timestamptz not null default now()
);
alter table response_templates enable row level security;
alter table response_templates force row level security;
drop policy if exists rtpl_read on response_templates;
create policy rtpl_read on response_templates for select
  using (organization_id in (select my_orgs()) and not is_client());
drop policy if exists rtpl_write on response_templates;
create policy rtpl_write on response_templates for all
  using (has_permission(organization_id, 'crm.write'))
  with check (has_permission(organization_id, 'crm.write'));
