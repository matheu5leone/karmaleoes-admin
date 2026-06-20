# Transversal — Storage de Imagens (Supabase Storage)

> Reutilizado pelos módulos com imagem: Banners (3), Conteúdos (5), Obras (6) e itens de Marquee (2).
> Base: [`CONVENTIONS.md §6`](../superpowers/plans/CONVENTIONS.md).

## 1. Princípios

- O **Hub não hospeda mídia** (vídeo/áudio/streaming) — apenas metadados + links externos.
- **Imagens administrativas** (banners, thumbnails, capas, ícones de marquee) são enviadas ao
  **Supabase Storage** (S3-compatível, CDN incluso; saída futura para S3/R2 viável).

## 2. Buckets por domínio

| Bucket | Usado por | Conteúdo |
|--------|-----------|----------|
| `banners` | Módulo 3 | imagem do banner (asset) |
| `conteudos` | Módulo 5 | thumbnail do conteúdo |
| `obras` | Módulo 6 | cover de música/coleção |
| `marquees` | Módulo 2 | imagem/ícone de item de marquee (se aplicável) |

Criados na infra (Plano 00). Política de acesso conforme sensibilidade: **público com CDN** para assets
exibidos no Hub; **signed URL** caso algum asset seja privado.

## 3. Fluxo de upload

1. O componente reutilizável **`ImageUpload`** (Plano 00) seleciona/pré-visualiza o arquivo.
2. A **Server Action** do módulo envia o arquivo via `lib/storage.ts` ao bucket correspondente.
3. Persiste o **path/URL** retornado na coluna da entidade (ex.: `banner.imagem`, `conteudo.thumbnail`,
   `musica.cover_image`).
4. Em edição que troca a imagem, considerar remoção do asset anterior (evitar órfãos).

## 4. Helper `lib/storage.ts`

- `upload(bucket, file) → { path, url }`
- `remove(bucket, path)`
- `getPublicUrl(bucket, path)` / `getSignedUrl(...)` conforme acesso.

## 5. Lacunas (a definir pelo dev)

- Formatos aceitos e **limites de tamanho** (validar na Server Action antes do upload).
- Redimensionamento/transformação de imagem (Supabase suporta; decidir por bucket).

## 6. Pontos de teste

- **Integration:** upload persiste path/URL na entidade; troca de imagem atualiza o campo; remoção
  limpa o asset. Validação de formato/limite rejeita arquivos inválidos.
