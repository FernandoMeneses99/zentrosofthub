-- 012_auto_profile: crear profiles automáticamente al registrarse (NO aplicado).
-- Sin esto, un técnico nuevo (auth.users) no tiene fila en profiles ni membresía.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (NEW.id, coalesce(NEW.email, 'usuario'))
  on conflict (id) do nothing;
  return NEW;
end $$;

drop trigger if exists trg_new_user on auth.users;
create trigger trg_new_user after insert on auth.users
for each row execute function handle_new_user();

-- backfill de usuarios existentes sin perfil:
insert into profiles (id, display_name)
select id, coalesce(email, 'usuario') from auth.users
on conflict (id) do nothing;
