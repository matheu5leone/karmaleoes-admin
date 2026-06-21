import { describe, expect, it } from "vitest";
import { conteudoSchema, categoriaSchema } from "@/lib/validation/conteudos";

describe("conteudoSchema", () => {
  const base = {
    titulo: "Bastidores",
    tipo: "video",
    link: "https://youtu.be/x",
    status: "publicado",
  };
  it("aceita conteúdo válido", () => {
    expect(conteudoSchema.safeParse(base).success).toBe(true);
  });
  it("rejeita sem link", () => {
    expect(conteudoSchema.safeParse({ ...base, link: "" }).success).toBe(false);
  });
  it("rejeita tipo inválido", () => {
    expect(conteudoSchema.safeParse({ ...base, tipo: "reel" }).success).toBe(false);
  });
  it("rejeita status inválido", () => {
    expect(conteudoSchema.safeParse({ ...base, status: "ativo" }).success).toBe(
      false,
    );
  });
});

describe("categoriaSchema", () => {
  it("aceita nome", () => {
    expect(categoriaSchema.safeParse({ nome: "Lançamentos" }).success).toBe(true);
  });
  it("rejeita vazio", () => {
    expect(categoriaSchema.safeParse({ nome: "" }).success).toBe(false);
  });
});
