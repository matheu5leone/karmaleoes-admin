import { describe, expect, it } from "vitest";
import { bannerSchema } from "@/lib/validation/banners";

describe("bannerSchema", () => {
  it("aceita nome + imagem", () => {
    expect(
      bannerSchema.safeParse({ nome: "Promo", imagem: "https://x/y.png" })
        .success,
    ).toBe(true);
  });
  it("rejeita sem nome", () => {
    expect(bannerSchema.safeParse({ nome: "", imagem: "x" }).success).toBe(false);
  });
  it("rejeita sem imagem", () => {
    expect(bannerSchema.safeParse({ nome: "X", imagem: "" }).success).toBe(false);
  });
});
