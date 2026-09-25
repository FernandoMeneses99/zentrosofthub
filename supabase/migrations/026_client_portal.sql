-- 026_client_portal: rol cliente con aislamiento por empresa (NO aplicado).
-- El cliente ve SOLO los datos de su(s) empresa(s) dentro del tenant.
-- Vínculo: contacts.user_id = auth.users.id (el owner lo asigna).

alter table contacts add column if not exists user_id uuid references profiles(id);

insert into permissions(code) values ('ticket.create'), ('portal.read') on conflict do nothing;
insert into role_permissions values
  ('owner','ticket.create'), ('owner','portal.read'),
  ('admin','ticket.create'), ('admin','portal.read'),
  ('manager','ticket.create'), ('manager','portal.read'),
  ('employee','portal.read'),
  ('client','ticket.create'), ('client','ticket.comment'), ('client','portal.read')
on conflict do nothing;

-- helpers
create or replace function is_client() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from organization_members
    where user_id = auth.uid() and status = 'active' and tenant_role = 'client')
$$;

create or replace function my_company_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select company_id from contacts
  where user_id = auth.uid() and company_id is not null and deleted_at is null
$$;

-- tickets: staff igual que antes (sin clientes); clientes solo su empresa.
drop policy if exists tickets_iso on tickets;
create policy tickets_staff on tickets for all
  using (organization_id in (select my_orgs()) and not is_client())
  with check (organization_id in (select my_orgs()) and not is_client());
drop policy if exists tickets_client_select on tickets;
create policy tickets_client_select on tickets for select
  using (company_id in (select my_company_ids()));
drop policy if exists tickets_client_insert on tickets;
create policy tickets_client_insert on tickets for insert
  with check (company_id in (select my_company_ids())
    and organization_id in (select my_orgs()));

-- el trigger de escritura de tickets usa ticket.create (staff la tiene; client también):
drop trigger if exists trg_w_tickets on tickets;
create trigger trg_w_tickets before insert or update or delete on tickets
for each row execute function guard_write_perm('ticket.create');

-- comentarios: clientes solo en sus tickets.
drop policy if exists tcomments_iso on ticket_comments;
create policy tcomments_staff on ticket_comments for all
  using (organization_id in (select my_orgs()) and not is_client())
  with check (organization_id in (select my_orgs()) and not is_client());
drop policy if exists tcomments_client on ticket_comments;
create policy tcomments_client on ticket_comments for select
  using (ticket_id in (select t.id from tickets t where t.company_id in (select my_company_ids())));
drop policy if exists tcomments_client_insert on ticket_comments;
create policy tcomments_client_insert on ticket_comments for insert
  with check (ticket_id in (select t.id from tickets t where t.company_id in (select my_company_ids()))
    and organization_id in (select my_orgs()));

-- documentos: clientes solo lectura de su empresa.
drop policy if exists documents_iso on documents;
create policy documents_staff on documents for all
  using (organization_id in (select my_orgs()) and not is_client())
  with check (organization_id in (select my_orgs()) and not is_client());
drop policy if exists documents_client on documents;
create policy documents_client on documents for select
  using (company_id in (select my_company_ids()));

-- empresas/contactos: clientes ven su(s) empresa(s) y sus contactos.
drop policy if exists companies_iso on companies;
create policy companies_staff on companies for all
  using (organization_id in (select my_orgs()) and not is_client())
  with check (organization_id in (select my_orgs()) and not is_client());
drop policy if exists companies_client on companies;
create policy companies_client on companies for select
  using (id in (select my_company_ids()));

drop policy if exists contacts_iso on contacts;
create policy contacts_staff on contacts for all
  using (organization_id in (select my_orgs()) and not is_client())
  with check (organization_id in (select my_orgs()) and not is_client());
drop policy if exists contacts_client on contacts;
create policy contacts_client on contacts for select
  using (company_id in (select my_company_ids()));
