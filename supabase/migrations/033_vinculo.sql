-- 033_vinculo: auto-vincula contacto por email al crear ticket (NO aplicado).
-- Resuelve "sin empresa asignada": el primer ticket del cliente enlaza su contacto.
create or replace function vincular_mi_contacto() returns uuid
language plpgsql security definer set search_path = public as $$
declare v_company uuid; v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then return null; end if;
  select company_id into v_company from contacts
  where lower(email) = lower(v_email)
    and organization_id in (select my_orgs())
    and company_id is not null
    and deleted_at is null
    and (user_id is null or user_id = auth.uid())
  order by updated_at desc nulls last limit 1;
  if v_company is null then return null; end if;
  update contacts set user_id = auth.uid()
  where lower(email) = lower(v_email) and company_id = v_company and user_id is null;
  return v_company;
end $$;
