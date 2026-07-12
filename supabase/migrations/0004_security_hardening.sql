-- Pin search_path on SECURITY DEFINER / trusted functions to close off
-- the classic search_path-hijacking vector (a malicious role creating
-- objects earlier in an unpinned search_path to shadow what the
-- function calls).
alter function create_company_and_owner(text, text) set search_path = public;
alter function set_updated_at() set search_path = public;
