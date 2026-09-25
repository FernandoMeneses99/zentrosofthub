-- 039_cierre: meses contables bloqueados + conteo para masiva (NO aplicado).
create table locked_months (
  organization_id uuid not null references organizations(id) on delete cascade,
  mes text not null check (mes ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  locked_by uuid, locked_at timestamptz not null default now(),
  primary key (organization_id, mes)
);
alter table locked_months enable row level security;
alter table locked_months force row level security;
drop policy if exists lm_read on locked_months;
create policy lm_read on locked_months for select
  using (organization_id in (select my_orgs()) and not is_client());
drop policy if exists lm_write on locked_months;
create policy lm_write on locked_months for all
  using (has_permission(organization_id, 'time.approve'))
  with check (has_permission(organization_id, 'time.approve'));

-- bloquea crear/editar/borrar horas de meses cerrados:
create or replace function guard_mes_cerrado() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_mes text;
begin
  v_mes := to_char(coalesce((to_jsonb(NEW)->>'fecha')::date, (to_jsonb(OLD)->>'fecha')::date), 'YYYY-MM');
  if exists (select 1 from locked_months
      where organization_id = coalesce((to_jsonb(NEW)->>'organization_id')::uuid, (to_jsonb(OLD)->>'organization_id')::uuid)
        and mes = v_mes) then
    raise exception 'Mes % bloqueado por cierre mensual', v_mes;
  end if;
  return coalesce(NEW, OLD);
end $$;

drop trigger if exists trg_mes_cerrado on time_entries;
create trigger trg_mes_cerrado before insert or update or delete on time_entries
for each row execute function guard_mes_cerrado();
