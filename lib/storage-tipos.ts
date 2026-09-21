/**
 * Buckets de imagem por domínio (ver transversal-storage-imagens.md).
 * Fica separado de lib/storage.ts porque aquele é `server-only` e o tipo
 * também é usado no cliente (ImageUpload, validação de formatos).
 */
export type Bucket = "marquees" | "banners" | "conteudos" | "obras";
