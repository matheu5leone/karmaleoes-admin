-- =============================================================================
-- 0011_storage_obras — Plano 06 (Storage de capas de obras)
-- Bucket público (serve via URL pública, sem policy de listagem — advisor 0025).
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('obras', 'obras', true)
on conflict (id) do nothing;

create policy "obras_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'obras' and public.is_active_admin());

create policy "obras_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'obras' and public.is_active_admin());

create policy "obras_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'obras' and public.is_active_admin());
