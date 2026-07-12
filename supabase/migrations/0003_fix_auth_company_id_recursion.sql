-- auth_company_id() was created without SECURITY DEFINER, so when a
-- table's RLS policy called it, its internal "select company_id from
-- profiles where id = auth.uid()" query re-triggered profiles' own RLS
-- policy (which also calls auth_company_id()), causing infinite
-- recursion. Every request touching an RLS-protected table failed with
-- a 500 as soon as a real signed-in user queried data. Marking the
-- function SECURITY DEFINER lets its internal lookup bypass RLS instead
-- of re-entering it.
create or replace function auth_company_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select company_id from profiles where id = auth.uid()
$$;
