import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  corHexOpcional,
  data,
  dataOpcional,
  email,
  horarioOpcional,
  instagramOpcional,
  isrcOpcional,
  rota,
  url,
  urlOpcional,
} from "@/lib/validation/comum";
import { errosPorCampo, ERRO_GERAL } from "@/lib/validation/erros";

const aceita = (schema: z.ZodTypeAny, v: unknown) => schema.safeParse(v).success;
const saida = (schema: z.ZodTypeAny, v: unknown) => schema.parse(v);

describe("e-mail", () => {
  it("aceita endereços comuns e normaliza caixa e espaços", () => {
    expect(saida(email, "  Banda@Karmaleoes.COM.br ")).toBe("banda@karmaleoes.com.br");
  });
  it("recusa sem arroba, sem domínio e com espaço no meio", () => {
    for (const v of ["banda", "banda@", "banda@local", "a b@x.com", "@x.com"]) {
      expect(aceita(email, v), v).toBe(false);
    }
  });
});

describe("endereço (URL)", () => {
  it("completa o protocolo quando falta", () => {
    expect(saida(url, "karmaleoes.com.br/shows")).toBe("https://karmaleoes.com.br/shows");
  });
  it("mantém http e https digitados", () => {
    expect(saida(url, "http://x.com")).toBe("http://x.com");
  });
  it("recusa texto solto e host sem ponto", () => {
    for (const v of ["não é link", "localhost", "ftp://x.com"]) {
      expect(aceita(url, v), v).toBe(false);
    }
  });
  it("opcional aceita vazio", () => {
    expect(aceita(urlOpcional, "")).toBe(true);
    expect(aceita(urlOpcional, undefined)).toBe(true);
    expect(aceita(urlOpcional, "x")).toBe(false);
  });
});

describe("instagram", () => {
  it("guarda só o handle, venha como URL ou com @", () => {
    expect(saida(instagramOpcional, "https://instagram.com/banda.karma/")).toBe("banda.karma");
    expect(saida(instagramOpcional, "@banda.karma")).toBe("banda.karma");
  });
  it("recusa caracteres fora do permitido", () => {
    expect(aceita(instagramOpcional, "banda karma")).toBe(false);
    expect(aceita(instagramOpcional, "banda/karma")).toBe(false);
  });
});

describe("data e horário", () => {
  it("recusa data que não existe no calendário", () => {
    expect(aceita(data, "2026-02-31")).toBe(false);
    expect(aceita(data, "2026-13-01")).toBe(false);
    expect(aceita(data, "31/01/2026")).toBe(false);
  });
  it("aceita 29 de fevereiro em ano bissexto", () => {
    expect(aceita(data, "2028-02-29")).toBe(true);
    expect(aceita(data, "2027-02-29")).toBe(false);
  });
  it("data opcional aceita vazio", () => {
    expect(aceita(dataOpcional, "")).toBe(true);
  });
  it("horário no formato HH:MM", () => {
    expect(aceita(horarioOpcional, "20:30")).toBe(true);
    expect(aceita(horarioOpcional, "24:00")).toBe(false);
    expect(aceita(horarioOpcional, "8:5")).toBe(false);
  });
});

describe("ISRC e cor", () => {
  it("normaliza o ISRC sem hífen e em maiúsculas", () => {
    expect(saida(isrcOpcional, "br-abc-25-00001")).toBe("BRABC2500001");
  });
  it("recusa ISRC curto", () => {
    expect(aceita(isrcOpcional, "BRABC250001")).toBe(false);
  });
  it("cor precisa de #RRGGBB", () => {
    expect(aceita(corHexOpcional, "#2b1d12")).toBe(true);
    expect(aceita(corHexOpcional, "2b1d12")).toBe(false);
    expect(aceita(corHexOpcional, "#fff")).toBe(false);
  });
});

describe("rota", () => {
  it("exige barra inicial", () => {
    expect(aceita(rota, "/parcerias")).toBe(true);
    expect(aceita(rota, "parcerias")).toBe(false);
    expect(aceita(rota, "/com espaço")).toBe(false);
  });
});

describe("erros por campo", () => {
  const schema = z.object({
    nome: z.string().min(1, "Informe o nome"),
    email,
  });

  it("junta uma mensagem por campo", () => {
    const r = schema.safeParse({ nome: "", email: "x" });
    expect(r.success).toBe(false);
    if (r.success) return;
    const mapa = errosPorCampo(r.error);
    expect(mapa.nome).toBe("Informe o nome");
    expect(mapa.email).toBeTruthy();
  });

  it("erro do objeto inteiro cai no geral", () => {
    const comRefine = z
      .object({ a: z.string(), b: z.string() })
      .refine((v) => v.a === v.b, "Os valores não conferem");
    const r = comRefine.safeParse({ a: "1", b: "2" });
    if (r.success) throw new Error("deveria falhar");
    expect(errosPorCampo(r.error)[ERRO_GERAL]).toBe("Os valores não conferem");
  });
});
