import { describe, expect, it } from "vitest";
import {
  accept,
  erroDoArquivo,
  listaLegivel,
  MAX_IMAGE_BYTES,
} from "@/lib/upload-formatos";
import { iconSchema } from "@/lib/validation/marquees";

const arquivo = (name: string, type: string, size = 1024) => ({ name, type, size });

describe("imagens do site (banners, obras, conteúdos)", () => {
  it("aceita PNG e WEBP", () => {
    expect(erroDoArquivo("banners", arquivo("capa.png", "image/png"))).toBeNull();
    expect(erroDoArquivo("obras", arquivo("capa.webp", "image/webp"))).toBeNull();
  });
  it("recusa JPG, GIF e PDF com mensagem clara", () => {
    for (const [nome, tipo] of [["foto.jpg", "image/jpeg"], ["anim.gif", "image/gif"], ["doc.pdf", "application/pdf"]]) {
      const erro = erroDoArquivo("conteudos", arquivo(nome, tipo));
      expect(erro).toContain("não é aceito");
      expect(erro).toContain("PNG ou WEBP");
    }
  });
  it("recusa SVG e ICO fora dos ícones", () => {
    expect(erroDoArquivo("banners", arquivo("icone.svg", "image/svg+xml"))).toContain("PNG ou WEBP");
    expect(erroDoArquivo("banners", arquivo("fav.ico", "image/x-icon"))).toContain("PNG ou WEBP");
  });
});

describe("ícones (bucket marquees)", () => {
  it("aceita PNG, WEBP, ICO e SVG", () => {
    expect(erroDoArquivo("marquees", arquivo("i.png", "image/png"))).toBeNull();
    expect(erroDoArquivo("marquees", arquivo("i.webp", "image/webp"))).toBeNull();
    expect(erroDoArquivo("marquees", arquivo("i.svg", "image/svg+xml"))).toBeNull();
    expect(erroDoArquivo("marquees", arquivo("i.ico", "image/x-icon"))).toBeNull();
  });
  it("aceita .ico mesmo quando o navegador não informa o tipo", () => {
    expect(erroDoArquivo("marquees", arquivo("i.ico", ""))).toBeNull();
  });
  it("continua recusando JPG", () => {
    expect(erroDoArquivo("marquees", arquivo("i.jpg", "image/jpeg"))).toContain("não é aceito");
  });
});

describe("casos-armadilha", () => {
  it("renomear um JPG para .png não passa", () => {
    expect(erroDoArquivo("banners", arquivo("disfarce.png", "image/jpeg"))).toContain("de verdade");
  });
  it("arquivo sem extensão dá mensagem própria", () => {
    expect(erroDoArquivo("banners", arquivo("semponto", ""))).toContain("Formato não reconhecido");
  });
  it("tamanho acima do limite é recusado com o valor em MB", () => {
    const erro = erroDoArquivo("banners", arquivo("g.png", "image/png", MAX_IMAGE_BYTES + 1));
    expect(erro).toContain("grande demais");
    expect(erro).toContain("5 MB");
  });
});

describe("apoio à interface", () => {
  it("accept cobre mimes e extensões", () => {
    expect(accept("banners")).toBe("image/png,image/webp,.png,.webp");
    expect(accept("marquees")).toContain(".svg");
  });
  it("lista legível usa 'ou' antes do último", () => {
    expect(listaLegivel("banners")).toBe("PNG ou WEBP");
    expect(listaLegivel("marquees")).toBe("PNG, WEBP, ICO ou SVG");
  });
});

describe("cadastro de ícone", () => {
  it("normaliza maiúsculas e aceita os quatro formatos", () => {
    expect(iconSchema.safeParse({ name: "coroa", extension: "SVG" }).success).toBe(true);
    expect(iconSchema.safeParse({ name: "coroa", extension: "ico" }).success).toBe(true);
  });
  it("recusa jpg com mensagem amigável", () => {
    const r = iconSchema.safeParse({ name: "coroa", extension: "jpg" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toContain("PNG, WEBP, ICO ou SVG");
  });
});
