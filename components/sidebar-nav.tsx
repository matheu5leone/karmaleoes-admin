"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  Crown,
  Disc3,
  LayoutDashboard,
  LayoutGrid,
  PlayCircle,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "@/components/nav-link";
import { cn } from "@/lib/utils";

type Folha = {
  tipo: "link";
  href: string;
  label: string;
  icon?: LucideIcon;
  /** Rotas de detalhe que também acendem este item (ex.: /obras/musica/[id]). */
  tambemAtivaEm?: string[];
};
type Grupo = {
  tipo: "grupo";
  id: string;
  label: string;
  icon?: LucideIcon;
  filhos: Item[];
};
type Item = Folha | Grupo;

export function montarArvore(isSuper: boolean): Item[] {
  const arvore: Item[] = [
    { tipo: "link", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      tipo: "grupo",
      id: "hub",
      label: "Hub Karmaleões",
      icon: Crown,
      filhos: [
        {
          tipo: "grupo",
          id: "hub.telas",
          label: "Gestão de Telas",
          icon: LayoutGrid,
          filhos: [
            { tipo: "link", href: "/telas", label: "Telas & Rotas" },
            { tipo: "link", href: "/marquees", label: "Marquees" },
            { tipo: "link", href: "/marquees/icones", label: "Ícones" },
            { tipo: "link", href: "/banners", label: "Banners" },
          ],
        },
        {
          tipo: "grupo",
          id: "hub.eventos",
          label: "Eventos",
          icon: CalendarDays,
          filhos: [
            { tipo: "link", href: "/eventos", label: "Gestão de Eventos" },
            { tipo: "link", href: "/eventos/categorias", label: "Categorias" },
            { tipo: "link", href: "/eventos/status", label: "Lifecycle & Status" },
          ],
        },
        {
          tipo: "grupo",
          id: "hub.obras",
          label: "Obras",
          icon: Disc3,
          filhos: [
            { tipo: "link", href: "/obras/colecoes", label: "Coleções", tambemAtivaEm: ["/obras/colecao"] },
            { tipo: "link", href: "/obras/musicas", label: "Músicas", tambemAtivaEm: ["/obras/musica"] },
            { tipo: "link", href: "/obras/colaboradores", label: "Colaboradores" },
            { tipo: "link", href: "/obras/roles", label: "Tipos de Colaborações" },
          ],
        },
        {
          tipo: "grupo",
          id: "hub.conteudos",
          label: "Conteúdos Externos",
          icon: PlayCircle,
          filhos: [{ tipo: "link", href: "/conteudos", label: "Gestão de Conteúdos" }],
        },
      ],
    },
  ];

  // O grupo inteiro é exclusivo do papel SUPER (a guarda real está na página e na RLS).
  if (isSuper) {
    arvore.push({
      tipo: "grupo",
      id: "super",
      label: "Super Admin",
      icon: ShieldCheck,
      filhos: [
        { tipo: "link", href: "/usuarios", label: "Gestão de Usuários" },
        { tipo: "link", href: "/historico", label: "Logs & Histórico de Ações" },
      ],
    });
  }
  return arvore;
}

const casa = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

/**
 * Item ativo = o de prefixo mais longo. Assim /marquees/icones acende "Ícones"
 * e não "Marquees", mesmo /marquees sendo prefixo dele.
 */
export function hrefAtivo(pathname: string, arvore: Item[]): string | null {
  let melhor: { href: string; tamanho: number } | null = null;
  const visitar = (itens: Item[]) => {
    for (const it of itens) {
      if (it.tipo === "grupo") {
        visitar(it.filhos);
        continue;
      }
      for (const base of [it.href, ...(it.tambemAtivaEm ?? [])]) {
        if (casa(pathname, base) && (!melhor || base.length > melhor.tamanho)) {
          melhor = { href: it.href, tamanho: base.length };
        }
      }
    }
  };
  visitar(arvore);
  return (melhor as { href: string } | null)?.href ?? null;
}

/** Ids dos grupos que contêm o item ativo (para abrir automaticamente). */
export function gruposAncestrais(arvore: Item[], alvo: string | null): string[] {
  if (!alvo) return [];
  const caminho: string[] = [];
  const buscar = (itens: Item[], pilha: string[]): boolean => {
    for (const it of itens) {
      if (it.tipo === "link" && it.href === alvo) {
        caminho.push(...pilha);
        return true;
      }
      if (it.tipo === "grupo" && buscar(it.filhos, [...pilha, it.id])) return true;
    }
    return false;
  };
  buscar(arvore, []);
  return caminho;
}

const CHAVE = "karma-sidebar-abertos";

export function SidebarNav({ isSuper }: { isSuper: boolean }) {
  const pathname = usePathname();
  const arvore = useMemo(() => montarArvore(isSuper), [isSuper]);
  const ativo = hrefAtivo(pathname, arvore);

  const [abertos, setAbertos] = useState<Set<string>>(
    () => new Set(gruposAncestrais(arvore, ativo)),
  );

  // Restaura o que a pessoa deixou aberto/fechado da última vez.
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) {
        setAbertos(
          (atual) => new Set([...(JSON.parse(salvo) as string[]), ...atual]),
        );
      }
    } catch {
      /* sem storage: segue com o padrão */
    }
  }, []);

  // Ao navegar, garante que o caminho até a página atual esteja aberto.
  useEffect(() => {
    const precisa = gruposAncestrais(arvore, ativo);
    if (precisa.every((id) => abertos.has(id))) return;
    setAbertos((atual) => new Set([...atual, ...precisa]));
    // `abertos` fora das dependências de propósito: só reage à navegação.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, arvore]);

  function alternar(id: string) {
    setAbertos((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      try {
        localStorage.setItem(CHAVE, JSON.stringify([...novo]));
      } catch {
        /* ignora */
      }
      return novo;
    });
  }

  return (
    <nav aria-label="Menu principal" className="flex flex-col gap-0.5 px-2">
      {arvore.map((it) => (
        <NoArvore
          key={it.tipo === "link" ? it.href : it.id}
          item={it}
          nivel={0}
          ativo={ativo}
          abertos={abertos}
          alternar={alternar}
        />
      ))}
    </nav>
  );
}

function NoArvore({
  item,
  nivel,
  ativo,
  abertos,
  alternar,
}: {
  item: Item;
  nivel: number;
  ativo: string | null;
  abertos: Set<string>;
  alternar: (id: string) => void;
}) {
  const recuo = nivel === 0 ? "pl-3" : nivel === 1 ? "pl-6" : "pl-10";
  const Icon = item.icon;

  if (item.tipo === "link") {
    const estaAtivo = item.href === ativo;
    return (
      <NavLink
        href={item.href}
        aria-current={estaAtivo ? "page" : undefined}
        className={cn(
          "flex min-h-9 items-center gap-2 rounded-md py-1.5 pr-3 text-sm transition-colors",
          recuo,
          estaAtivo
            ? "bg-brand-subtle font-semibold text-brand"
            : "text-foreground/80 hover:bg-accent hover:text-foreground",
        )}
      >
        {Icon ? (
          <Icon className={cn("size-[18px] shrink-0", estaAtivo ? "text-brand" : "text-muted-foreground")} />
        ) : (
          <span
            aria-hidden
            className={cn("size-1.5 shrink-0 rounded-full", estaAtivo ? "bg-brand" : "bg-border")}
          />
        )}
        <span className="min-w-0">{item.label}</span>
      </NavLink>
    );
  }

  const aberto = abertos.has(item.id);
  const contemAtivo = gruposAncestrais([item], ativo).length > 0;
  const idLista = `grupo-${item.id.replace(/\./g, "-")}`;

  return (
    <div>
      <button
        type="button"
        onClick={() => alternar(item.id)}
        aria-expanded={aberto}
        aria-controls={idLista}
        className={cn(
          "flex min-h-9 w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm transition-colors hover:bg-accent",
          recuo,
          nivel === 0 ? "font-semibold text-foreground" : "font-medium",
          nivel > 0 && (contemAtivo ? "text-brand" : "text-foreground/80"),
        )}
      >
        {Icon && (
          <Icon
            className={cn(
              "size-[18px] shrink-0",
              contemAtivo ? "text-brand" : "text-muted-foreground",
            )}
          />
        )}
        <span className="min-w-0 flex-1">{item.label}</span>
        <ChevronRight
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-150",
            aberto && "rotate-90",
          )}
        />
      </button>
      {aberto && (
        <div
          id={idLista}
          className="mt-0.5 flex flex-col gap-0.5"
        >
          {item.filhos.map((f) => (
            <NoArvore
              key={f.tipo === "link" ? f.href : f.id}
              item={f}
              nivel={nivel === 0 ? 1 : 2}
              ativo={ativo}
              abertos={abertos}
              alternar={alternar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
