import { describe, expect, it } from "vitest";
import {
  eventoSchema,
  statusEventoSchema,
  sucessoPermitido,
} from "@/lib/validation/eventos";

const uuid = "11111111-1111-1111-1111-111111111111";

describe("eventoSchema", () => {
  it("aceita evento mínimo válido", () => {
    expect(
      eventoSchema.safeParse({ nome: "Show", data: "2030-01-01", status_id: uuid })
        .success,
    ).toBe(true);
  });
  it("rejeita sem nome", () => {
    expect(
      eventoSchema.safeParse({ nome: "", data: "2030-01-01", status_id: uuid })
        .success,
    ).toBe(false);
  });
  it("rejeita sem data", () => {
    expect(
      eventoSchema.safeParse({ nome: "X", data: "", status_id: uuid }).success,
    ).toBe(false);
  });
});

describe("statusEventoSchema", () => {
  it("rejeita o nome reservado 'Expirado'", () => {
    expect(
      statusEventoSchema.safeParse({ nome: "Expirado", lifecycle: "Em aberto" })
        .success,
    ).toBe(false);
  });
});

describe("sucessoPermitido (RN-EVENTO-014)", () => {
  it("permite na data de referência ou depois", () => {
    expect(sucessoPermitido("2026-06-21", "2026-06-21")).toBe(true);
    expect(sucessoPermitido("2026-06-21", "2026-06-22")).toBe(true);
  });
  it("bloqueia antes da data de referência", () => {
    expect(sucessoPermitido("2026-06-21", "2026-06-20")).toBe(false);
  });
});
