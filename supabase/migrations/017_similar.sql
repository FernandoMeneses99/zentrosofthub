-- 017_similar: detección de tickets duplicados con pg_trgm (NO aplicado).
create extension if not exists "pg_trgm" with schema extensions;
create index if not exists tickets_titulo_trgm_idx on tickets using gin (titulo extensions.gin_trgm_ops);

create or replace function similar_tickets(p_org uuid, p_titulo text, p_excluir uuid default null)
returns table (id uuid, titulo text, estado text, sim real)
language sql stable security definer set search_path = public, extensions as $$
  select t.id, t.titulo, t.estado, extensions.similarity(t.titulo, p_titulo)::real as sim
  from tickets t
  where t.organization_id = p_org
    and t.id is distinct from p_excluir
    and t.estado in ('abierto','en_proceso','pendiente')
    and extensions.similarity(t.titulo, p_titulo) > 0.3
  order by sim desc limit 5;
$$;
