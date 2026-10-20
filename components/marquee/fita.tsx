"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type ItemFita = {
  titulo: string;
  iconeUrl?: string | null;
  /** Cor do ícone; sem ela o arquivo aparece com as cores próprias. */
  corIcone?: string | null;
};

/**
 * A fita do marquee como o site mostra: itens em sequência, deslizando em laço.
 *
 * O laço é contínuo porque a trilha é repetida até cobrir a janela mais um
 * grupo inteiro, e a animação anda exatamente a largura de **um** grupo — com
 * duas cópias fixas, uma lista curta deixava um vão em branco atravessando a
 * tela antes de voltar. A duração acompanha a largura, então a velocidade é a
 * mesma independentemente de quantos itens existem.
 */
export function FitaMarquee({
  itens,
  corFundo,
  corTexto,
  /** Pixels por segundo. */
  velocidade = 55,
  className,
  vazio = "Nenhum item ainda.",
}: {
  itens: ItemFita[];
  corFundo?: string | null;
  corTexto?: string | null;
  velocidade?: number;
  className?: string;
  vazio?: string;
}) {
  const janela = useRef<HTMLDivElement>(null);
  const grupo = useRef<HTMLUListElement>(null);
  const [largura, setLargura] = useState(0);
  const [copias, setCopias] = useState(2);

  useEffect(() => {
    const j = janela.current;
    const g = grupo.current;
    if (!j || !g) return;

    const medir = () => {
      const w = g.getBoundingClientRect().width;
      setLargura(w);
      setCopias(w > 0 ? Math.max(2, Math.ceil(j.clientWidth / w) + 1) : 2);
    };
    medir();

    // Reage à janela mudando de tamanho e aos ícones carregando depois.
    const ro = new ResizeObserver(medir);
    ro.observe(j);
    ro.observe(g);
    return () => ro.disconnect();
  }, [itens]);

  const fundo = corFundo || "#17130d";
  const texto = corTexto || "#f2e9d8";

  if (itens.length === 0) {
    return (
      <div
        className={cn("overflow-hidden rounded-md border border-border", className)}
        style={{ backgroundColor: fundo }}
      >
        <p className="px-4 py-3 text-center text-sm opacity-70" style={{ color: texto }}>
          {vazio}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={janela}
      className={cn("overflow-hidden rounded-md border border-border", className)}
      style={{ backgroundColor: fundo }}
    >
      <div
        className="fita-marquee flex w-max"
        style={
          {
            "--fita-passo": `-${largura}px`,
            // Enquanto não mediu, duração 0 deixa a fita parada em vez de
            // piscar com uma animação de passo errado.
            animationDuration: largura ? `${largura / velocidade}s` : "0s",
          } as React.CSSProperties
        }
      >
        {Array.from({ length: copias }, (_, copia) => (
          <ul
            key={copia}
            ref={copia === 0 ? grupo : undefined}
            aria-hidden={copia > 0 ? true : undefined}
            className="flex shrink-0 items-center gap-10 px-5 py-2.5"
          >
            {itens.map((it, i) => (
              <li
                key={`${copia}-${i}`}
                className="flex items-center gap-2 whitespace-nowrap"
                style={{ color: texto }}
              >
                {it.iconeUrl && <Icone url={it.iconeUrl} cor={it.corIcone} />}
                <span className="text-sm font-medium">{it.titulo || "Sem texto"}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/**
 * Com cor, o ícone vira máscara e quem pinta é o fundo — é o único jeito de
 * recolorir um arquivo de imagem no navegador. Sem cor, mostra o arquivo.
 */
function Icone({ url, cor }: { url: string; cor?: string | null }) {
  if (cor) {
    return (
      <span
        aria-hidden
        className="size-5 shrink-0"
        style={{
          backgroundColor: cor,
          maskImage: `url(${url})`,
          WebkitMaskImage: `url(${url})`,
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="size-5 shrink-0 object-contain" />
  );
}
