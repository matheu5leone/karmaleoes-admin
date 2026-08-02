"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { formatDuracao } from "@/lib/utils";
import {
  linkSchema,
  vinculoSchema,
  type LinkInput,
  type ObraTipo,
  type VinculoInput,
} from "@/lib/validation/obras";

export type ActionResult = { ok: true } | { ok: false; error: string };

function obraRef(tipo: ObraTipo, id: string) {
  return tipo === "musica" ? { musica_id: id } : { colecao_id: id };
}

// ---- Grafo de vínculos (board da obra) ----

export type GrafoNo = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagem: string | null;
};
export type GrafoColaborador = {
  vinculoId: string;
  nome: string;
  papel: string;
  instagram: string | null;
};
export type GrafoLink = { id: string; plataforma: string; url: string };
export type Opt = { id: string; nome: string };
export type ObraGrafo = {
  centro: {
    id: string;
    tipo: ObraTipo;
    titulo: string;
    imagem: string | null;
    meta: string[];
  };
  /** Coleção (quando a obra é música) ou músicas da coleção. Somente leitura. */
  relacionados: { rotulo: string; itens: GrafoNo[] };
  colaboradores: GrafoColaborador[];
  links: GrafoLink[];
  opcoes: { colaboradores: Opt[]; roles: Opt[] };
};

type VinculoJoin = {
  id: string;
  colaborador: { nome: string; instagram: string | null } | null;
  role: { nome: string } | null;
};

/**
 * Carrega tudo que o board da obra precisa em UMA chamada (as queries rodam em
 * paralelo no servidor) — cada ida ao Supabase custa ~700ms, então evitamos
 * encadear round-trips a partir do cliente.
 */
export async function getObraGrafo(
  tipo: ObraTipo,
  obraId: string,
): Promise<{ ok: true; grafo: ObraGrafo } | { ok: false; error: string }> {
  const supabase = await createClient();
  const ref = tipo === "musica" ? "musica_id" : "colecao_id";

  const [obra, vinculos, links, colaboradores, roles, musicasDaColecao] =
    await Promise.all([
      tipo === "musica"
        ? supabase
            .from("musica")
            .select(
              "id, nome, duracao, isrc, data_lancamento, cover_image, colecao(id, nome, tipo, cover_image)",
            )
            .eq("id", obraId)
            .single()
        : supabase
            .from("colecao")
            .select("id, nome, tipo, data_lancamento, cover_image, descricao")
            .eq("id", obraId)
            .single(),
      supabase
        .from("obra_colaborador")
        .select("id, colaborador(nome, instagram), role(nome)")
        .eq(ref, obraId),
      supabase.from("link_plataforma").select("id, plataforma, url").eq(ref, obraId),
      supabase.from("colaborador").select("id, nome").order("nome"),
      supabase.from("role").select("id, nome").order("nome"),
      tipo === "colecao"
        ? supabase
            .from("musica")
            .select("id, nome, duracao, cover_image")
            .eq("colecao_id", obraId)
            .order("nome")
        : Promise.resolve({ data: null }),
    ]);

  if (!obra.data) return { ok: false, error: "Obra não encontrada." };
  const o = obra.data as Record<string, unknown>;

  // Metadados exibidos como chips no card central.
  const meta: string[] = [];
  if (tipo === "musica") {
    const dur = o.duracao as number | null;
    if (dur != null) meta.push(formatDuracao(dur));
    if (o.isrc) meta.push(String(o.isrc));
  } else {
    meta.push(String(o.tipo));
  }
  if (o.data_lancamento) meta.push(String(o.data_lancamento));

  const relacionados: ObraGrafo["relacionados"] =
    tipo === "musica"
      ? (() => {
          const c = o.colecao as
            | { id: string; nome: string; tipo: string; cover_image: string | null }
            | null;
          return {
            rotulo: "Coleção",
            itens: c
              ? [{ id: c.id, titulo: c.nome, subtitulo: c.tipo, imagem: c.cover_image }]
              : [],
          };
        })()
      : {
          rotulo: "Músicas",
          itens: ((musicasDaColecao.data ?? []) as Array<{
            id: string;
            nome: string;
            duracao: number | null;
            cover_image: string | null;
          }>).map((m) => ({
            id: m.id,
            titulo: m.nome,
            subtitulo: m.duracao != null ? formatDuracao(m.duracao) : null,
            imagem: m.cover_image,
          })),
        };

  return {
    ok: true,
    grafo: {
      centro: {
        id: String(o.id),
        tipo,
        titulo: String(o.nome),
        imagem: (o.cover_image as string | null) ?? null,
        meta,
      },
      relacionados,
      colaboradores: ((vinculos.data ?? []) as unknown as VinculoJoin[]).map((v) => ({
        vinculoId: v.id,
        nome: v.colaborador?.nome ?? "?",
        papel: v.role?.nome ?? "?",
        instagram: v.colaborador?.instagram ?? null,
      })),
      links: (links.data ?? []) as GrafoLink[],
      opcoes: {
        colaboradores: (colaboradores.data ?? []) as Opt[],
        roles: (roles.data ?? []) as Opt[],
      },
    },
  };
}

export async function vincularColaborador(
  tipo: ObraTipo,
  obraId: string,
  input: VinculoInput,
): Promise<ActionResult> {
  const p = vinculoSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obra_colaborador")
    .insert({
      ...obraRef(tipo, obraId),
      colaborador_id: p.data.colaborador_id,
      role_id: p.data.role_id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "create", entidade: "obra_colaborador", registroId: data.id });
  revalidatePath(`/obras/${tipo}/${obraId}`);
  return { ok: true };
}

export async function removerColaborador(
  tipo: ObraTipo,
  obraId: string,
  vinculoId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("obra_colaborador")
    .delete()
    .eq("id", vinculoId);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "delete", entidade: "obra_colaborador", registroId: vinculoId });
  revalidatePath(`/obras/${tipo}/${obraId}`);
  return { ok: true };
}

export async function adicionarLink(
  tipo: ObraTipo,
  obraId: string,
  input: LinkInput,
): Promise<ActionResult> {
  const p = linkSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("link_plataforma")
    .insert({ ...obraRef(tipo, obraId), plataforma: p.data.plataforma, url: p.data.url })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "create", entidade: "link_plataforma", registroId: data.id });
  revalidatePath(`/obras/${tipo}/${obraId}`);
  return { ok: true };
}

export async function removerLink(
  tipo: ObraTipo,
  obraId: string,
  linkId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("link_plataforma")
    .delete()
    .eq("id", linkId);
  if (error) return { ok: false, error: error.message };
  await audit({ acao: "delete", entidade: "link_plataforma", registroId: linkId });
  revalidatePath(`/obras/${tipo}/${obraId}`);
  return { ok: true };
}
