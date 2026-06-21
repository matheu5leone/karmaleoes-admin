import { describe, expect, it } from "vitest";
import { telaSchema } from "@/lib/validation/telas";
import { itemSchema } from "@/lib/validation/marquees";

describe("telaSchema", () => {
  it("aceita nome + rota válidos", () => {
    expect(telaSchema.safeParse({ nome: "Eventos", rota: "/eventos" }).success).toBe(true);
  });
  it("rejeita rota sem barra inicial", () => {
    expect(telaSchema.safeParse({ nome: "X", rota: "eventos" }).success).toBe(false);
  });
  it("rejeita nome vazio", () => {
    expect(telaSchema.safeParse({ nome: "", rota: "/x" }).success).toBe(false);
  });
});

describe("itemSchema — XOR de destino (RN-NAV-005)", () => {
  const base = { titulo: "Item", ordem: 0 };

  it("interno válido: tela_destino_id e sem url", () => {
    const r = itemSchema.safeParse({
      ...base,
      tipo_nav: "interno",
      tela_destino_id: "11111111-1111-1111-1111-111111111111",
      url_externa: null,
    });
    expect(r.success).toBe(true);
  });

  it("externo válido: url e sem tela", () => {
    const r = itemSchema.safeParse({
      ...base,
      tipo_nav: "externo",
      tela_destino_id: null,
      url_externa: "https://exemplo.com",
    });
    expect(r.success).toBe(true);
  });

  it("rejeita interno sem tela de destino", () => {
    const r = itemSchema.safeParse({
      ...base,
      tipo_nav: "interno",
      tela_destino_id: null,
      url_externa: null,
    });
    expect(r.success).toBe(false);
  });

  it("rejeita externo com tela e url ao mesmo tempo", () => {
    const r = itemSchema.safeParse({
      ...base,
      tipo_nav: "externo",
      tela_destino_id: "11111111-1111-1111-1111-111111111111",
      url_externa: "https://exemplo.com",
    });
    expect(r.success).toBe(false);
  });
});
