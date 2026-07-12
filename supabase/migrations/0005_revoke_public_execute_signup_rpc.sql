-- create_company_and_owner relies on auth.uid() and is only meaningful
-- for a signed-in caller; revoke it from PUBLIC (which includes anon)
-- so it isn't reachable as an anonymous RPC endpoint, and keep it
-- available to authenticated callers only.
revoke execute on function create_company_and_owner(text, text) from public;
grant execute on function create_company_and_owner(text, text) to authenticated;
