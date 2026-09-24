-- 014_sla_base: campos SLA en tickets (NO aplicado).
-- Prepara vencimientos por prioridad sin imponer todavía la política de horas.
alter table tickets add column if not exists sla_horas int;
alter table tickets add column if not exists sla_vence timestamptz;

create or replace function set_ticket_sla() returns trigger
language plpgsql as $$
begin
  if NEW.sla_horas is null then
    NEW.sla_horas := case NEW.prioridad
      when 'urgente' then 4 when 'alta' then 24 when 'media' then 72 else 168 end;
  end if;
  NEW.sla_vence := NEW.created_at + (NEW.sla_horas || ' hours')::interval;
  return NEW;
end $$;

drop trigger if exists trg_ticket_sla on tickets;
create trigger trg_ticket_sla before insert on tickets
for each row execute function set_ticket_sla();

-- Vista de tickets vencidos abiertos (respeta RLS vía tabla base):
create or replace view tickets_vencidos as
select id, organization_id, titulo, prioridad, sla_vence from tickets
where estado in ('abierto','en_proceso','pendiente') and sla_vence < now();
