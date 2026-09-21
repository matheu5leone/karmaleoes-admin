import type { Bucket } from "@/lib/storage-tipos";

/**
 * Formatos aceitos no upload, por bucket. Fonte única: o mesmo arquivo alimenta
 * o `accept` do seletor, a validação imediata no cliente e a checagem no
 * servidor — assim as três não saem de sincronia.
 *
 * Imagens do site ficam em PNG e WEBP. Ícones aceitam ainda ICO e SVG, porque
 * são desenhos pequenos que precisam escalar sem perder nitidez.
 */
type Formato = { ext: string; mimes: string[] };

const PNG: Formato = { ext: "png", mimes: ["image/png"] };
const WEBP: Formato = { ext: "webp", mimes: ["image/webp"] };
const SVG: Formato = { ext: "svg", mimes: ["image/svg+xml"] };
// Navegadores divergem no MIME de .ico; alguns mandam vazio.
const ICO: Formato = {
  ext: "ico",
  mimes: ["image/x-icon", "image/vnd.microsoft.icon", "image/ico"],
};

const IMAGENS: Formato[] = [PNG, WEBP];
const ICONES: Formato[] = [PNG, WEBP, ICO, SVG];

export const FORMATOS_POR_BUCKET: Record<Bucket, Formato[]> = {
  banners: IMAGENS,
  conteudos: IMAGENS,
  obras: IMAGENS,
  marquees: ICONES, // bucket dos ícones de marquee
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Valor do atributo `accept` do <input type="file">. */
export function accept(bucket: Bucket): string {
  const f = FORMATOS_POR_BUCKET[bucket];
  return [...f.flatMap((x) => x.mimes), ...f.map((x) => `.${x.ext}`)].join(",");
}

/** "PNG, WEBP, ICO ou SVG" — para a mensagem de erro. */
export function listaLegivel(bucket: Bucket): string {
  const nomes = FORMATOS_POR_BUCKET[bucket].map((f) => f.ext.toUpperCase());
  return nomes.length === 1
    ? nomes[0]
    : `${nomes.slice(0, -1).join(", ")} ou ${nomes[nomes.length - 1]}`;
}

function extensaoDe(nome: string): string {
  const i = nome.lastIndexOf(".");
  return i === -1 ? "" : nome.slice(i + 1).toLowerCase();
}

/**
 * Devolve a mensagem de erro, ou null quando o arquivo serve.
 * Confere a extensão E o tipo informado pelo navegador — só a extensão seria
 * fácil de burlar renomeando o arquivo.
 */
export function erroDoArquivo(
  bucket: Bucket,
  arquivo: { name: string; type: string; size: number },
): string | null {
  const permitidos = FORMATOS_POR_BUCKET[bucket];
  const ext = extensaoDe(arquivo.name);
  const formato = permitidos.find((f) => f.ext === ext);

  if (!formato) {
    return `${ext ? `Arquivo .${ext} não é aceito` : "Formato não reconhecido"}. Envie ${listaLegivel(bucket)}.`;
  }
  // type vazio acontece de verdade com .ico em alguns sistemas.
  if (arquivo.type && !formato.mimes.includes(arquivo.type)) {
    return `O arquivo parece não ser um ${formato.ext.toUpperCase()} de verdade. Envie ${listaLegivel(bucket)}.`;
  }
  if (arquivo.size > MAX_IMAGE_BYTES) {
    const mb = (arquivo.size / 1024 / 1024).toFixed(1);
    return `Imagem de ${mb} MB é grande demais (máximo 5 MB).`;
  }
  return null;
}
