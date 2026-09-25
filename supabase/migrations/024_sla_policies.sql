-- 024_sla_policies: SLA configurable por organización (NO aplicado).
create table sla_policies (
  organization_id uuid not null references organizations(id) on delete cascade,
  prioridad text not null check (prioridad in ('baja','media','alta','urgente')),
  horas int not null check (horas > 0),
  primary key (organization_id, prioridad)
);

alter table sla_policies enable row level security;
alter table sla_policies force row level security;
drop policy if exists sla_iso on sla_policies;
drop policy if exists sla_read on sla_policies;
create policy sla_read on sla_policies for select
  using (organization_id in (select my_orgs()));
drop policy if exists sla_write on sla_policies;
create policy sla_write on sla_policies for all
  using (has_permission(organization_id, 'users.manage'))
  with check (has_permission(organization_id, 'users.manage'));

-- el trigger usa la política de la org, con fallback a los valores originales:
create or replace function set_ticket_sla() returns trigger
language plpgsql as $$
declare v_horas int;
begin
  if NEW.sla_horas is null then
    select horas into v_horas from sla_policies
    where organization_id = NEW.organization_id and prioridad = NEW.prioridad;
    NEW.sla_horas := coalesce(v_horas,
      case NEW.prioridad when 'urgente' then 4 when 'alta' then 24 when 'media' then 72 else 168 end);
  end if;
  NEW.sla_vence := NEW.created_at + (NEW.sla_horas || ' hours')::interval;
  return NEW;
end $$;
