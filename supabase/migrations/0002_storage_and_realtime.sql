-- ============================================================================
-- Storage: private bucket for load documents, scoped by company folder
-- Path convention: documents/{company_id}/{load_id}/{filename}
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "read own company documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth_company_id()::text
  );

create policy "upload to own company folder"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth_company_id()::text
  );

create policy "delete own company documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth_company_id()::text
  );

-- ============================================================================
-- Realtime: dispatcher dashboard subscribes to these for live updates
-- (load status changes, new detention events, new recovery flags)
-- ============================================================================
alter publication supabase_realtime add table loads;
alter publication supabase_realtime add table detention_events;
alter publication supabase_realtime add table revenue_recovery_items;
alter publication supabase_realtime add table documents;
