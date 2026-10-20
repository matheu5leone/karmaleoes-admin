import { describe, expect, it } from "vitest";
import {
  impedimentosParaPublicar,
  motivoDeNaoPublicar,
  podePublicar,
} from "@/lib/eventos/publicacao";
import { dentroDoPeriodo, hojeISO } from "@/app/(admin)/eventos/periodos";

const completo = {
  nome: "Show",
  data: "2026-12-01",
  local: "São Paulo",
  category_id: "11111111-1111-1111-1111-111111111111",
  lifecycle: "Em aberto",
};

describe("publicar evento no Hub", () => {
  it("aceita evento completo e em aberto", () => {
    expect(podePublicar(completo)).toBe(true);
    expect(motivoDeNaoPublicar(completo)).toBeNull();
  });

  it("lista cada campo que falta", () => {
    expect(impedimentosParaPublicar({ ...completo, local: "" })).toEqual(["local"]);
    expect(
      impedimentosParaPublicar({ ...completo, local: "  ", category_id: null }),
    ).toEqual(["local", "categoria"]);
  });

  it("barra encerrado mesmo com tudo preenchido", () => {
    const encerrado = { ...completo, lifecycle: "Encerrado" };
    expect(podePublicar(encerrado)).toBe(false);
    expect(motivoDeNaoPublicar(encerrado)).toBe("Evento encerrado não vai ao Hub.");
  });

  it("o motivo nomeia os campos quando é questão de preenchimento", () => {
    expect(motivoDeNaoPublicar({ ...completo, nome: "" })).toBe(
      "Falta preencher: nome.",
    );
  });
});

describe("período dos eventos", () => {
  const hoje = hojeISO();
  const daqui = (d: number) =>
    new Date(Date.now() + d * 86400000).toLocaleDateString("en-CA");

  it('"todos" não filtra nada', () => {
    expect(dentroDoPeriodo(daqui(-500), "todos", "", "")).toBe(true);
    expect(dentroDoPeriodo(daqui(500), "todos", "", "")).toBe(true);
  });

  it("próximos 7 dias pega hoje e exclui o passado e o 8º dia", () => {
    expect(dentroDoPeriodo(hoje, "7d", "", "")).toBe(true);
    expect(dentroDoPeriodo(daqui(7), "7d", "", "")).toBe(true);
    expect(dentroDoPeriodo(daqui(8), "7d", "", "")).toBe(false);
    expect(dentroDoPeriodo(daqui(-1), "7d", "", "")).toBe(false);
  });

  it("futuros e passados se dividem em hoje", () => {
    expect(dentroDoPeriodo(hoje, "futuros", "", "")).toBe(true);
    expect(dentroDoPeriodo(hoje, "passados", "", "")).toBe(true);
    expect(dentroDoPeriodo(daqui(-1), "futuros", "", "")).toBe(false);
    expect(dentroDoPeriodo(daqui(1), "passados", "", "")).toBe(false);
  });

  it("personalizado respeita as duas pontas, e cada uma sozinha", () => {
    expect(dentroDoPeriodo("2026-06-15", "custom", "2026-06-01", "2026-06-30")).toBe(true);
    expect(dentroDoPeriodo("2026-07-01", "custom", "2026-06-01", "2026-06-30")).toBe(false);
    expect(dentroDoPeriodo("2026-07-01", "custom", "2026-06-01", "")).toBe(true);
    expect(dentroDoPeriodo("2026-05-01", "custom", "", "2026-06-30")).toBe(true);
  });
});
