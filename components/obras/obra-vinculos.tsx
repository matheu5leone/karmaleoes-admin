"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { ObraTipo } from "@/lib/validation/obras";
import {
  adicionarLink,
  removerColaborador,
  removerLink,
  vincularColaborador,
} from "@/app/(admin)/obras/vinculos";

type Opt = { id: string; nome: string };
export type VinculoView = {
  id: string;
  colaborador_nome: string;
  role_nome: string;
};
export type LinkView = { id: string; plataforma: string; url: string };

export function ObraVinculos({
  tipo,
  obraId,
  colaboradores,
  roles,
  vinculos,
  links,
}: {
  tipo: ObraTipo;
  obraId: string;
  colaboradores: Opt[];
  roles: Opt[];
  vinculos: VinculoView[];
  links: LinkView[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();

  const [colId, setColId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [plataforma, setPlataforma] = useState("");
  const [url, setUrl] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    start(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error ?? "Falha.");
      else toast.success(ok);
      router.refresh();
    });
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Colaboradores</h2>
        <ul className="mb-4 divide-y divide-border">
          {vinculos.length === 0 && (
            <li className="py-2 text-sm text-muted-foreground">Nenhum vínculo.</li>
          )}
          {vinculos.map((v) => (
            <li key={v.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {v.colaborador_nome}
                <span className="text-muted-foreground"> · {v.role_nome}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() =>
                  run(() => removerColaborador(tipo, obraId, v.id), "Vínculo removido.")
                }
              >
                Remover
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end gap-2">
          <Select value={colId} onChange={(e) => setColId(e.target.value)} className="w-40">
            <option value="">Colaborador…</option>
            {colaboradores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
          <Select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-36">
            <option value="">Papel…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </Select>
          <Button
            disabled={pending || !colId || !roleId}
            onClick={() =>
              run(
                () => vincularColaborador(tipo, obraId, { colaborador_id: colId, role_id: roleId }),
                "Colaborador vinculado.",
              )
            }
          >
            Adicionar
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Links de plataforma
        </h2>
        <ul className="mb-4 divide-y divide-border">
          {links.length === 0 && (
            <li className="py-2 text-sm text-muted-foreground">Nenhum link.</li>
          )}
          {links.map((l) => (
            <li key={l.id} className="flex items-center justify-between py-2 text-sm">
              <span className="truncate">
                {l.plataforma}
                <span className="text-muted-foreground"> · {l.url}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => run(() => removerLink(tipo, obraId, l.id), "Link removido.")}
              >
                Remover
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end gap-2">
          <Input
            value={plataforma}
            onChange={(e) => setPlataforma(e.target.value)}
            placeholder="Spotify"
            className="w-32"
          />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="w-48"
          />
          <Button
            disabled={pending || !plataforma || !url}
            onClick={() =>
              run(() => adicionarLink(tipo, obraId, { plataforma, url }), "Link adicionado.")
            }
          >
            Adicionar
          </Button>
        </div>
      </section>
    </div>
  );
}
