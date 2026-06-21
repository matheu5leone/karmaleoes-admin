-- =============================================================================
-- 0009_storage_conteudos — Plano 05 (Storage de thumbnails de conteúdo)
-- Bucket público (serve via URL pública, sem policy de listagem — advisor 0025).
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('conteudos', 'conteudos', true)
on conflict (id) do nothing;

create policy "conteudos_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'conteudos' and public.is_active_admin());

create policy "conteudos_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'conteudos' and public.is_active_admin());

create policy "conteudos_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'conteudos' and public.is_active_admin());
