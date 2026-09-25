-- 028_client_own: el cliente solo ve los tickets que él creó (NO aplicado).
drop policy if exists tickets_client_select on tickets;
create policy tickets_client_select on tickets for select
  using (created_by = auth.uid());
drop policy if exists tickets_client_insert on tickets;
create policy tickets_client_insert on tickets for insert
  with check (created_by = auth.uid()
    and company_id in (select my_company_ids())
    and organization_id in (select my_orgs()));

drop policy if exists tcomments_client on ticket_comments;
create policy tcomments_client on ticket_comments for select
  using (ticket_id in (select t.id from tickets t where t.created_by = auth.uid()));
drop policy if exists tcomments_client_insert on ticket_comments;
create policy tcomments_client_insert on ticket_comments for insert
  with check (ticket_id in (select t.id from tickets t where t.created_by = auth.uid())
    and organization_id in (select my_orgs()));

-- similares: clientes solo dentro de su(s) empresa(s).
create or replace function similar_tickets(p_org uuid, p_titulo text, p_excluir uuid default null)
returns table (id uuid, titulo text, estado text, sim real)
language sql stable security definer set search_path = public, extensions as $$
  select t.id, t.titulo, t.estado, extensions.similarity(t.titulo, p_titulo)::real as sim
  from tickets t
  where t.organization_id = p_org
    and t.id is distinct from p_excluir
    and t.estado in ('abierto','en_proceso','pendiente')
    and extensions.similarity(t.titulo, p_titulo) > 0.3
    and (not is_client() or t.company_id in (select my_company_ids()))
  order by sim desc limit 5;
$$;
