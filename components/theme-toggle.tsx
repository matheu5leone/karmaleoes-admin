"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tema = "claro" | "escuro" | "sistema";
export const TEMA_STORAGE_KEY = "karma-tema";

const OPCOES: { valor: Tema; rotulo: string; Icone: typeof Sun }[] = [
  { valor: "claro", rotulo: "Claro", Icone: Sun },
  { valor: "escuro", rotulo: "Escuro", Icone: Moon },
  { valor: "sistema", rotulo: "Sistema", Icone: Monitor },
];

/** Aplica (ou remove) a classe `dark` conforme o tema escolhido. */
function aplicar(tema: Tema) {
  const escuro =
    tema === "escuro" ||
    (tema === "sistema" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", escuro);
}

export function ThemeToggle() {
  // O tema real já foi aplicado pelo script inline no layout (evita piscar);
  // aqui só sincronizamos o estado do controle.
  const [tema, setTema] = useState<Tema>("sistema");

  useEffect(() => {
    const salvo = localStorage.getItem(TEMA_STORAGE_KEY) as Tema | null;
    if (salvo) setTema(salvo);
  }, []);

  // Em "sistema", acompanha a mudança de preferência do SO em tempo real.
  useEffect(() => {
    if (tema !== "sistema") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = () => aplicar("sistema");
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [tema]);

  function escolher(valor: Tema) {
    setTema(valor);
    localStorage.setItem(TEMA_STORAGE_KEY, valor);
    aplicar(valor);
  }

  return (
    <div
      role="group"
      aria-label="Tema"
      className="flex rounded-md border border-border p-0.5"
    >
      {OPCOES.map(({ valor, rotulo, Icone }) => (
        <button
          key={valor}
          type="button"
          onClick={() => escolher(valor)}
          aria-pressed={tema === valor}
          title={rotulo}
          className={cn(
            "flex flex-1 items-center justify-center rounded py-1.5 transition-colors",
            tema === valor
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icone className="size-4" />
          <span className="sr-only">{rotulo}</span>
        </button>
      ))}
    </div>
  );
}
