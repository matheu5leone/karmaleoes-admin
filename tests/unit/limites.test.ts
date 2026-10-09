import { describe, expect, it } from "vitest";
import type { ZodType } from "zod";
import { LIMITES } from "@/lib/validation/limites";
import { telaSchema } from "@/lib/validation/telas";
import { bannerSchema } from "@/lib/validation/banners";
import { marqueeSchema, itemSchema } from "@/lib/validation/marquees";
import {
  categoriaEventoSchema,
  eventoSchema,
  statusEventoSchema,
} from "@/lib/validation/eventos";
import {
  colaboradorSchema,
  colecaoSchema,
  musicaSchema,
  roleSchema,
} from "@/lib/validation/obras";
import { categoriaSchema, conteudoSchema } from "@/lib/validation/conteudos";

const texto = (n: number) => "a".repeat(n);

/** Caso: schema, campo do nome, limite e o resto do payload mínimo válido. */
type Caso = {
  rotulo: string;
  schema: ZodType;
  campo: string;
  max: number;
  resto: Record<string, unknown>;
};

const CASOS: Caso[] = [
  { rotulo: "tela", schema: telaSchema, campo: "nome", max: LIMITES.telaNome, resto: { rota: "/x" } },
  { rotulo: "banner", schema: bannerSchema, campo: "nome", max: LIMITES.bannerNome, resto: { imagem: "img.png" } },
  { rotulo: "marquee", schema: marqueeSchema, campo: "nome", max: LIMITES.marqueeNome, resto: {} },
  {
    rotulo: "item de marquee",
    schema: itemSchema,
    campo: "titulo",
    max: LIMITES.marqueeItemTitulo,
    resto: { tipo_nav: "externo", url_externa: "https://x.com" },
  },
  {
    rotulo: "evento",
    schema: eventoSchema,
    campo: "nome",
    max: LIMITES.eventoNome,
    resto: {
      data: "2026-01-01",
      status_id: "11111111-1111-1111-1111-111111111111",
    },
  },
  { rotulo: "status de evento", schema: statusEventoSchema, campo: "nome", max: LIMITES.statusNome, resto: { lifecycle: "Em aberto" } },
  { rotulo: "categoria de evento", schema: categoriaEventoSchema, campo: "name", max: LIMITES.categoriaNome, resto: {} },
  { rotulo: "música", schema: musicaSchema, campo: "nome", max: LIMITES.musicaNome, resto: {} },
  { rotulo: "coleção", schema: colecaoSchema, campo: "nome", max: LIMITES.colecaoNome, resto: { tipo: "album" } },
  { rotulo: "colaborador", schema: colaboradorSchema, campo: "nome", max: LIMITES.colaboradorNome, resto: {} },
  { rotulo: "tipo de colaboração", schema: roleSchema, campo: "nome", max: LIMITES.roleNome, resto: {} },
  {
    rotulo: "conteúdo",
    schema: conteudoSchema,
    campo: "titulo",
    max: LIMITES.conteudoTitulo,
    resto: { tipo: "video", link: "https://x.com", status: "draft" },
  },
  { rotulo: "categoria de conteúdo", schema: categoriaSchema, campo: "nome", max: LIMITES.categoriaNome, resto: {} },
];

describe("limite de caracteres dos nomes", () => {
  it.each(CASOS)("$rotulo aceita exatamente $max", ({ schema, campo, max, resto }) => {
    const r = schema.safeParse({ ...resto, [campo]: texto(max) });
    expect(r.success).toBe(true);
  });

  it.each(CASOS)("$rotulo recusa $max + 1 com mensagem clara", ({ schema, campo, max, resto }) => {
    const r = schema.safeParse({ ...resto, [campo]: texto(max + 1) });
    expect(r.success).toBe(false);
    if (r.success) return;
    const issue = r.error.issues.find((i) => i.path[0] === campo);
    expect(issue?.message).toBe(`Máximo de ${max} caracteres`);
  });

  // O trim roda antes do max: espaço nas pontas não deve gastar o orçamento.
  it("não conta espaço das pontas", () => {
    const r = telaSchema.safeParse({
      nome: `  ${texto(LIMITES.telaNome)}  `,
      rota: "/x",
    });
    expect(r.success).toBe(true);
  });
});
