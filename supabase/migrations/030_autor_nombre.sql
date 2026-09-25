-- 030_autor_nombre: nombre visible del autor en comentarios (NO aplicado).
alter table ticket_comments add column if not exists autor_nombre text;

create or replace function set_comment_author() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  NEW.autor_nombre := coalesce(
    (select display_name from profiles where id = auth.uid()),
    (select email from auth.users where id = auth.uid()),
    'Usuario');
  return NEW;
end $$;

drop trigger if exists trg_comment_author on ticket_comments;
create trigger trg_comment_author before insert on ticket_comments
for each row execute function set_comment_author();

-- backfill existentes (con el guard de escritura pausado: SQL Editor no tiene JWT
-- y el trigger exigiría ticket.comment; se reactiva justo después):
alter table ticket_comments disable trigger trg_w_tcomments;
update ticket_comments c set autor_nombre = p.display_name
from profiles p where p.id = c.autor and c.autor_nombre is null;
alter table ticket_comments enable trigger trg_w_tcomments;
