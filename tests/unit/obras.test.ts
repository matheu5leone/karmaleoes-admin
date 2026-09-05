import { describe, expect, it } from "vitest";
import {
  colecaoSchema,
  linkSchema,
  musicaSchema,
  roleSchema,
} from "@/lib/validation/obras";

describe("musicaSchema", () => {
  it("aceita nome", () => {
    expect(musicaSchema.safeParse({ nome: "Faixa 1" }).success).toBe(true);
  });
  it("rejeita sem nome", () => {
    expect(musicaSchema.safeParse({ nome: "" }).success).toBe(false);
  });
});

describe("colecaoSchema", () => {
  it("aceita tipo album/EP", () => {
    expect(colecaoSchema.safeParse({ nome: "X", tipo: "album" }).success).toBe(true);
    expect(colecaoSchema.safeParse({ nome: "X", tipo: "EP" }).success).toBe(true);
  });
  it("rejeita tipo inválido", () => {
    expect(colecaoSchema.safeParse({ nome: "X", tipo: "single" }).success).toBe(
      false,
    );
  });
});

describe("roleSchema", () => {
  it("aceita nome", () => {
    expect(roleSchema.safeParse({ nome: "feat" }).success).toBe(true);
  });
  it("rejeita vazio", () => {
    expect(roleSchema.safeParse({ nome: "" }).success).toBe(false);
  });
});

describe("linkSchema", () => {
  it("aceita url do domínio da plataforma", () => {
    expect(
      linkSchema.safeParse({
        plataforma: "Spotify",
        url: "https://open.spotify.com/album/raizes",
      }).success,
    ).toBe(true);
  });
  it("prepende https:// quando o usuário omite", () => {
    const r = linkSchema.safeParse({
      plataforma: "Spotify",
      url: "open.spotify.com/album/raizes",
    });
    expect(r.success && r.data.url.startsWith("https://")).toBe(true);
  });
  it("rejeita url de domínio que não é da plataforma", () => {
    expect(
      linkSchema.safeParse({
        plataforma: "Spotify",
        url: "https://youtube.com/watch?v=x",
      }).success,
    ).toBe(false);
  });
  it("rejeita sem url", () => {
    expect(linkSchema.safeParse({ plataforma: "Spotify", url: "" }).success).toBe(
      false,
    );
  });
});
