import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import type { Bucket } from "@/lib/storage-tipos";

/**
 * Tudo que o dashboard mostra, numa leitura só.
 *
 * As tabelas do painel são pequenas (a maior tem algumas centenas de linhas),
 * então sai mais barato trazer as linhas e somar aqui do que pedir ao banco uma
 * agregação por indicador — seriam ~20 idas de rede, cada uma custando mais que
 * a conta inteira. As consultas vão todas em paralelo.
 */

export type TelaNoAr = {
  id: string;
  nome: string;
  rota: string;
  banner: { nome: string; imagem: string } | null;
  marquees: { nome: string; itens: string[] }[];
};

export type Pendencia = {
  chave: string;
  rotulo: string;
  n: number;
  href: string;
  /** Pendência de publicação (gules) ou de preenchimento (tenné). */
  grave: boolean;
};

export type EventoResumo = {
  id: string;
  nome: string;
  data: string;
  local: string | null;
  status: string;
  noHub: boolean;
};

export type Resumo = {
  numeros: {
    telasNoAr: number;
    telasTotal: number;
    eventosNoHub: number;
    eventosTotal: number;
    conteudosPublicados: number;
    conteudosTotal: number;
    musicas: number;
    duracaoTotalSeg: number;
    colecoes: number;
    colaboradores: number;
  };
  telas: TelaNoAr[];
  pendencias: Pendencia[];
  agenda: {
    proximos: EventoResumo[];
    porMes: { mes: string; passados: number; futuros: number }[];
    porLifecycle: { nome: string; n: number }[];
    atrasados: number;
  };
  catalogo: {
    capas: { id: string; titulo: string; imagem: string; tipo: "colecao" | "musica" }[];
    cobertura: { rotulo: string; ok: number; total: number }[];
    topColaboradores: { nome: string; n: number }[];
  };
  operacao: {
    /** `null` quando a chave service-role não está configurada (dev local). */
    buckets: { nome: string; arquivos: number; bytes: number; orfaos: number }[] | null;
    cron: { ultima: string | null; total: number };
    contas: { total: number; ativos: number; sem2fa: number; senhaTemp: number; supers: number };
  };
  /** Só para SUPER — mesma regra do Histórico. */
  atividade: {
    total: number;
    semAutor: number;
    porDia: { dia: string; n: number }[];
    porEntidade: { entidade: string; n: number }[];
    porAutor: { autor: string; n: number }[];
    ultimas: { id: string; acao: string; entidade: string; autor: string; quando: string }[];
  } | null;
};

const BUCKETS: Bucket[] = ["banners", "conteudos", "obras"];

/** yyyy-mm no fuso de São Paulo. */
const mesDe = (iso: string) => iso.slice(0, 7);

function contarPor<T>(linhas: T[], chave: (l: T) => string | null | undefined) {
  const mapa = new Map<string, number>();
  for (const l of linhas) {
    const k = chave(l);
    if (!k) continue;
    mapa.set(k, (mapa.get(k) ?? 0) + 1);
  }
  return mapa;
}

type Linha = Record<string, unknown>;

export async function getResumo(isSuper: boolean): Promise<Resumo> {
  const supabase = await createClient();
  const hoje = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });

  const [
    telas,
    banners,
    bannerTela,
    marquees,
    marqueeTela,
    marqueeItens,
    eventos,
    statuses,
    conteudos,
    musicas,
    colecoes,
    colaboradores,
    obraColaborador,
    links,
    admins,
    keepAlive,
    auditoria,
  ] = await Promise.all([
    sel(supabase, "tela", "id, nome, rota, status"),
    sel(supabase, "banner", "id, nome, imagem"),
    sel(supabase, "banner_tela", "banner_id, tela_id, status"),
    sel(supabase, "marquee", "id, nome"),
    sel(supabase, "marquee_tela", "marquee_id, tela_id"),
    sel(supabase, "marquee_item", "marquee_id, titulo, ordem"),
    sel(supabase, "evento", "id, nome, data, local, lifecycle, status_id, enable"),
    sel(supabase, "status_evento", "id, nome"),
    sel(supabase, "conteudo", "id, status, destaque, thumbnail"),
    sel(supabase, "musica", "id, nome, cover_image, duracao, isrc, colecao_id"),
    sel(supabase, "colecao", "id, nome, cover_image"),
    sel(supabase, "colaborador", "id, nome"),
    sel(supabase, "obra_colaborador", "colaborador_id, musica_id, colecao_id"),
    sel(supabase, "link_plataforma", "musica_id, colecao_id"),
    sel(supabase, "admin_user", "id, email, status, two_factor_configured, senha_temporaria, user_role"),
    sel(supabase, "keep_alive_log", "executado_em"),
    isSuper
      ? sel(supabase, "audit_log", "id, acao, entidade, user_id, created_at")
      : Promise.resolve([] as Linha[]),
  ]);

  const arquivos = await listarArquivos([
    ...banners.map((b) => str(b.imagem)),
    ...conteudos.map((c) => str(c.thumbnail)),
    ...musicas.map((m) => str(m.cover_image)),
    ...colecoes.map((c) => str(c.cover_image)),
  ].filter(Boolean));

  // ---------------------------------------------------------------- no ar
  const nomeStatus = new Map(statuses.map((s) => [str(s.id), str(s.nome)]));
  const publicadoPorTela = new Map<string, string>();
  for (const a of bannerTela) {
    if (str(a.status) === "publicado") publicadoPorTela.set(str(a.tela_id), str(a.banner_id));
  }
  const bannerPorId = new Map(banners.map((b) => [str(b.id), b]));
  const itensPorMarquee = new Map<string, string[]>();
  for (const i of [...marqueeItens].sort((a, b) => num(a.ordem) - num(b.ordem))) {
    const lista = itensPorMarquee.get(str(i.marquee_id)) ?? [];
    lista.push(str(i.titulo));
    itensPorMarquee.set(str(i.marquee_id), lista);
  }
  const marqueePorId = new Map(marquees.map((m) => [str(m.id), m]));

  const habilitadas = telas.filter((t) => str(t.status) === "habilitada");
  const telasNoAr: TelaNoAr[] = habilitadas.map((t) => {
    const bannerId = publicadoPorTela.get(str(t.id));
    const b = bannerId ? bannerPorId.get(bannerId) : undefined;
    return {
      id: str(t.id),
      nome: str(t.nome),
      rota: str(t.rota),
      banner: b ? { nome: str(b.nome), imagem: str(b.imagem) } : null,
      marquees: marqueeTela
        .filter((mt) => str(mt.tela_id) === str(t.id))
        .map((mt) => {
          const m = marqueePorId.get(str(mt.marquee_id));
          return {
            nome: m ? str(m.nome) : "—",
            itens: itensPorMarquee.get(str(mt.marquee_id)) ?? [],
          };
        }),
    };
  });

  // ---------------------------------------------------------------- catálogo
  const musicasComLink = new Set(links.map((l) => str(l.musica_id)).filter(Boolean));
  const musicasComColab = new Set(
    obraColaborador.map((o) => str(o.musica_id)).filter(Boolean),
  );
  const totalMusicas = musicas.length;
  const cobertura = [
    { rotulo: "Capa", ok: musicas.filter((m) => !!m.cover_image).length, total: totalMusicas },
    { rotulo: "Link de plataforma", ok: musicas.filter((m) => musicasComLink.has(str(m.id))).length, total: totalMusicas },
    { rotulo: "Colaborador", ok: musicas.filter((m) => musicasComColab.has(str(m.id))).length, total: totalMusicas },
    { rotulo: "ISRC", ok: musicas.filter((m) => !!m.isrc).length, total: totalMusicas },
    { rotulo: "Coleção", ok: musicas.filter((m) => !!m.colecao_id).length, total: totalMusicas },
  ];

  const nomeColaborador = new Map(colaboradores.map((c) => [str(c.id), str(c.nome)]));
  const topColaboradores = [...contarPor(obraColaborador, (o) => str(o.colaborador_id))]
    .map(([id, n]) => ({ nome: nomeColaborador.get(id) ?? "—", n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);

  const capas = [
    ...colecoes
      .filter((c) => !!c.cover_image)
      .map((c) => ({ id: str(c.id), titulo: str(c.nome), imagem: str(c.cover_image), tipo: "colecao" as const })),
    ...musicas
      .filter((m) => !!m.cover_image)
      .map((m) => ({ id: str(m.id), titulo: str(m.nome), imagem: str(m.cover_image), tipo: "musica" as const })),
  ];

  // ---------------------------------------------------------------- agenda
  const futuros = eventos.filter((e) => str(e.data) >= hoje);
  const proximos: EventoResumo[] = [...futuros]
    .sort((a, b) => str(a.data).localeCompare(str(b.data)))
    .slice(0, 5)
    .map((e) => ({
      id: str(e.id),
      nome: str(e.nome),
      data: str(e.data),
      local: e.local ? str(e.local) : null,
      status: nomeStatus.get(str(e.status_id)) ?? "—",
      noHub: !!e.enable,
    }));

  const meses = new Map<string, { passados: number; futuros: number }>();
  for (const e of eventos) {
    const m = mesDe(str(e.data));
    const atual = meses.get(m) ?? { passados: 0, futuros: 0 };
    if (str(e.data) >= hoje) atual.futuros += 1;
    else atual.passados += 1;
    meses.set(m, atual);
  }
  const porMes = [...meses]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([mes, v]) => ({ mes, ...v }));

  const porLifecycle = [...contarPor(eventos, (e) => str(e.lifecycle))].map(([nome, n]) => ({
    nome,
    n,
  }));
  const atrasados = eventos.filter(
    (e) => str(e.data) < hoje && str(e.lifecycle) === "Em aberto",
  ).length;

  // ---------------------------------------------------------------- pendências
  const telasSemBanner = habilitadas.filter((t) => !publicadoPorTela.has(str(t.id))).length;
  const bannersPublicados = new Set([...publicadoPorTela.values()]);
  const pendencias: Pendencia[] = [
    { chave: "tela-sem-banner", rotulo: "Telas no ar sem banner publicado", n: telasSemBanner, href: "/banners", grave: true },
    { chave: "banner-rascunho", rotulo: "Banners nunca publicados", n: banners.filter((b) => !bannersPublicados.has(str(b.id))).length, href: "/banners", grave: true },
    { chave: "marquee-vazio", rotulo: "Marquees sem nenhum item", n: marquees.filter((m) => (itensPorMarquee.get(str(m.id)) ?? []).length === 0).length, href: "/marquees", grave: true },
    { chave: "evento-atrasado", rotulo: "Eventos com data passada ainda em aberto", n: atrasados, href: "/eventos", grave: true },
    { chave: "musica-sem-link", rotulo: "Músicas sem link de plataforma", n: totalMusicas - (cobertura[1]?.ok ?? 0), href: "/obras/musicas", grave: false },
    { chave: "musica-sem-colab", rotulo: "Músicas sem colaborador", n: totalMusicas - (cobertura[2]?.ok ?? 0), href: "/obras/musicas", grave: false },
    { chave: "musica-sem-capa", rotulo: "Músicas sem capa", n: totalMusicas - (cobertura[0]?.ok ?? 0), href: "/obras/musicas", grave: false },
    { chave: "conteudo-sem-thumb", rotulo: "Conteúdos sem thumbnail", n: conteudos.filter((c) => !c.thumbnail).length, href: "/conteudos", grave: false },
    { chave: "arquivo-orfao", rotulo: "Imagens enviadas que ninguém usa", n: (arquivos ?? []).reduce((s, b) => s + b.orfaos, 0), href: "/conteudos", grave: false },
  ].filter((p) => p.n > 0);

  // ---------------------------------------------------------------- atividade
  let atividade: Resumo["atividade"] = null;
  if (isSuper) {
    const emailPorId = new Map<string, string>();
    for (const a of admins) emailPorId.set(str(a.id), str(a.email));
    const limite = Date.now() - 29 * 24 * 60 * 60 * 1000;
    const recentes = auditoria.filter((l) => new Date(str(l.created_at)).getTime() >= limite);

    atividade = {
      total: auditoria.length,
      semAutor: auditoria.filter((l) => !l.user_id).length,
      porDia: diasRecentes(30).map((dia) => ({
        dia,
        n: recentes.filter((l) => diaSP(str(l.created_at)) === dia).length,
      })),
      porEntidade: [...contarPor(auditoria, (l) => str(l.entidade))]
        .map(([entidade, n]) => ({ entidade, n }))
        .sort((a, b) => b.n - a.n)
        .slice(0, 6),
      porAutor: [...contarPor(auditoria, (l) => (l.user_id ? str(l.user_id) : "sistema"))]
        .map(([id, n]) => ({ autor: id === "sistema" ? "fora do painel" : (emailPorId.get(id) ?? "—"), n }))
        .sort((a, b) => b.n - a.n)
        .slice(0, 5),
      ultimas: [...auditoria]
        .sort((a, b) => str(b.created_at).localeCompare(str(a.created_at)))
        .slice(0, 5)
        .map((l) => ({
          id: str(l.id),
          acao: str(l.acao),
          entidade: str(l.entidade),
          autor: l.user_id ? (emailPorId.get(str(l.user_id)) ?? "—") : "fora do painel",
          quando: str(l.created_at),
        })),
    };
  }

  return {
    numeros: {
      telasNoAr: habilitadas.length,
      telasTotal: telas.length,
      eventosNoHub: eventos.filter((e) => !!e.enable).length,
      eventosTotal: eventos.length,
      conteudosPublicados: conteudos.filter((c) => str(c.status) === "publicado").length,
      conteudosTotal: conteudos.length,
      musicas: totalMusicas,
      duracaoTotalSeg: musicas.reduce((s, m) => s + num(m.duracao), 0),
      colecoes: colecoes.length,
      colaboradores: colaboradores.length,
    },
    telas: telasNoAr,
    pendencias,
    agenda: { proximos, porMes, porLifecycle, atrasados },
    catalogo: { capas, cobertura, topColaboradores },
    operacao: {
      buckets: arquivos,
      cron: {
        ultima:
          keepAlive.length > 0
            ? [...keepAlive].sort((a, b) => str(b.executado_em).localeCompare(str(a.executado_em)))[0]
                .executado_em as string
            : null,
        total: keepAlive.length,
      },
      contas: {
        total: admins.length,
        ativos: admins.filter((a) => str(a.status) === "ativo").length,
        sem2fa: admins.filter((a) => !a.two_factor_configured).length,
        senhaTemp: admins.filter((a) => !!a.senha_temporaria).length,
        supers: admins.filter((a) => str(a.user_role) === "SUPER").length,
      },
    },
    atividade,
  };
}

// ------------------------------------------------------------------ apoio

type Cliente = Awaited<ReturnType<typeof createClient>>;
type Tabela = keyof Database["public"]["Tables"];

/**
 * Select cru: o dashboard só conta e agrupa, então as linhas chegam como
 * `Record<string, unknown>` e a tipagem fina fica nos tipos do `Resumo`.
 */
async function sel(cliente: Cliente, tabela: Tabela, colunas: string): Promise<Linha[]> {
  const { data } = await cliente.from(tabela).select(colunas);
  return (data ?? []) as unknown as Linha[];
}

/**
 * Arquivos de cada bucket e quantos estão órfãos — enviados e depois
 * descolados do registro (troca de imagem sem apagar a anterior, por exemplo).
 *
 * Listar exige ignorar a RLS de `storage.objects`: os buckets são públicos para
 * leitura por URL, mas não têm policy de SELECT, então o client da sessão
 * devolveria lista vazia e o painel mostraria zero sem avisar. Daí o client
 * service-role, que é server-only e aqui só conta arquivos. Sem a chave (dev
 * local), devolve `null` e o bloco some do painel em vez de mentir.
 */
async function listarArquivos(usados: string[]) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const admin = createAdminClient();

  const listas = await Promise.all(
    BUCKETS.map((b) => admin.storage.from(b).list("", { limit: 1000 })),
  );

  return BUCKETS.map((nome, i) => {
    const itens = listas[i]?.data ?? [];
    return {
      nome,
      arquivos: itens.length,
      bytes: itens.reduce((s, o) => s + (o.metadata?.size ?? 0), 0),
      orfaos: itens.filter((o) => !usados.some((u) => u.endsWith(o.name))).length,
    };
  });
}

/** Data (yyyy-mm-dd) de um timestamp, no fuso de São Paulo. */
function diaSP(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

/** Os últimos `n` dias, do mais antigo para o mais novo. */
function diasRecentes(n: number): string[] {
  const dias: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    dias.push(diaSP(new Date(Date.now() - i * 86400000).toISOString()));
  }
  return dias;
}

const str = (v: unknown): string => (v == null ? "" : String(v));
const num = (v: unknown): number => (typeof v === "number" ? v : 0);
