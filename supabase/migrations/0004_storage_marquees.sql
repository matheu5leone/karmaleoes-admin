-- =============================================================================
-- 0004_storage_marquees — Plano 02 (Storage antecipado)
-- Bucket de imagens de marquee + policies. Ver transversal-storage-imagens.md.
-- =============================================================================

-- Bucket público para leitura (assets exibidos no Hub via CDN).
insert into storage.buckets (id, name, public)
values ('marquees', 'marquees', true)
on conflict (id) do nothing;

-- Leitura: o bucket é público (serve via URL pública sem RLS); NÃO criamos policy
-- de SELECT para não permitir listagem dos arquivos (advisor 0025).
-- Escrita restrita a admin autenticado e ativo:
create policy "marquees_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'marquees' and public.is_active_admin());

create policy "marquees_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'marquees' and public.is_active_admin());

create policy "marquees_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'marquees' and public.is_active_admin());
