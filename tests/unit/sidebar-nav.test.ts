import { describe, expect, it } from "vitest";
import {
  gruposAncestrais,
  hrefAtivo,
  montarArvore,
} from "@/components/sidebar-nav";

const admin = montarArvore(false);
const sup = montarArvore(true);

describe("hrefAtivo", () => {
  it("acende o item exato", () => {
    expect(hrefAtivo("/telas", admin)).toBe("/telas");
  });
  it("prefixo mais longo vence: /marquees/icones acende Ícones, não Marquees", () => {
    expect(hrefAtivo("/marquees/icones", admin)).toBe("/marquees/icones");
  });
  it("detalhe de marquee acende Marquees", () => {
    expect(hrefAtivo("/marquees/abc-123", admin)).toBe("/marquees");
  });
  it("subpáginas de eventos não acendem Gestão de Eventos", () => {
    expect(hrefAtivo("/eventos/categorias", admin)).toBe("/eventos/categorias");
    expect(hrefAtivo("/eventos/status", admin)).toBe("/eventos/status");
  });
  it("detalhes de obra acendem a lista certa", () => {
    expect(hrefAtivo("/obras/musica/xyz", admin)).toBe("/obras/musicas");
    expect(hrefAtivo("/obras/colecao/xyz", admin)).toBe("/obras/colecoes");
  });
  it("não confunde prefixo parcial (/telasx não é /telas)", () => {
    expect(hrefAtivo("/telasx", admin)).toBeNull();
  });
});

describe("Super Admin", () => {
  it("some para ADMIN", () => {
    expect(hrefAtivo("/usuarios", admin)).toBeNull();
    expect(admin.some((i) => i.tipo === "grupo" && i.id === "super")).toBe(false);
  });
  it("aparece para SUPER", () => {
    expect(hrefAtivo("/historico", sup)).toBe("/historico");
  });
});

describe("gruposAncestrais", () => {
  it("abre os dois níveis até o item", () => {
    expect(gruposAncestrais(admin, "/marquees/icones")).toEqual(["hub", "hub.telas"]);
    expect(gruposAncestrais(admin, "/obras/roles")).toEqual(["hub", "hub.obras"]);
  });
  it("Super Admin tem um nível só", () => {
    expect(gruposAncestrais(sup, "/usuarios")).toEqual(["super"]);
  });
  it("Dashboard não abre grupo nenhum", () => {
    expect(gruposAncestrais(admin, "/dashboard")).toEqual([]);
  });
});

import { PERIODOS, PERIODO_PADRAO, normalizarPeriodo } from "@/app/(admin)/historico/periodos";

describe("períodos do histórico", () => {
  it("tem as opções pedidas, nesta ordem", () => {
    expect(Object.keys(PERIODOS)).toEqual(["24h", "7d", "15d", "30d", "3m", "custom"]);
  });
  it("só 'Personalizado' não tem janela fixa", () => {
    expect(PERIODOS.custom.horas).toBeNull();
    expect(PERIODOS["24h"].horas).toBe(24);
    expect(PERIODOS["3m"].horas).toBe(24 * 90);
  });
  it("valor inválido ou ausente cai no padrão", () => {
    expect(normalizarPeriodo(undefined)).toBe(PERIODO_PADRAO);
    expect(normalizarPeriodo("tudo")).toBe(PERIODO_PADRAO);
    expect(normalizarPeriodo("30d")).toBe("30d");
  });
});
