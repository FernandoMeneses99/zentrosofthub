-- 034_cliente_plus: Telegram cliente, encuesta, mantenimientos, realtime (NO aplicado).
alter table contacts add column if not exists telegram_chat_id text;
alter table tickets add column if not exists encuesta text;

-- cliente puede actualizar SOLO su telegram (trigger lo garantiza):
drop policy if exists contacts_client_update on contacts;
create policy contacts_client_update on contacts for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function guard_contact_self() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_client() then
    if NEW.user_id is distinct from OLD.user_id
      or NEW.organization_id is distinct from OLD.organization_id
      or NEW.company_id is distinct from OLD.company_id
      or NEW.nombre is distinct from OLD.nombre then
      raise exception 'Solo puedes actualizar tu Telegram';
    end if;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_contact_self on contacts;
create trigger trg_contact_self before update on contacts
for each row execute function guard_contact_self();

-- mantenimientos programados:
create table mantenimientos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  titulo text not null, descripcion text,
  inicio timestamptz not null, fin timestamptz,
  created_at timestamptz not null default now()
);
alter table mantenimientos enable row level security;
alter table mantenimientos force row level security;
drop policy if exists mant_read on mantenimientos;
create policy mant_read on mantenimientos for select
  using (organization_id in (select my_orgs()));
drop policy if exists mant_write on mantenimientos;
create policy mant_write on mantenimientos for all
  using (has_permission(organization_id, 'crm.write'))
  with check (has_permission(organization_id, 'crm.write'));

-- realtime para comentarios:
alter publication supabase_realtime add table ticket_comments;
