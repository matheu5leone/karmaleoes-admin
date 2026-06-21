-- =============================================================================
-- 0006_storage_banners — Plano 03 (Storage de banners)
-- Bucket público (serve via URL pública, sem policy de listagem — advisor 0025).
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

create policy "banners_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'banners' and public.is_active_admin());

create policy "banners_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'banners' and public.is_active_admin());

create policy "banners_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'banners' and public.is_active_admin());
