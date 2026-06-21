"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { alternarStatus, criarUsuario, editarTelefone } from "./actions";

export type Usuario = {
  id: string;
  email: string;
  telefone: string | null;
  status: string;
  two_factor_configured: boolean;
};

export function NovoUsuario() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    start(async () => {
      const r = await criarUsuario({ email, telefone, senhaTemporaria: senha });
      if (!r.ok) return setError(r.error);
      setEmail("");
      setTelefone("");
      setSenha("");
      setOk(true);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="mb-8 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-4 sm:items-end"
    >
      <div className="space-y-1.5">
        <Label htmlFor="novo-email">E-mail</Label>
        <Input
          id="novo-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="novo-tel">Telefone (opcional)</Label>
        <Input
          id="novo-tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="novo-senha">Senha temporária</Label>
        <Input
          id="novo-senha"
          type="text"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Cadastrando..." : "Cadastrar"}
      </Button>
      {error && (
        <p className="text-sm text-destructive sm:col-span-4">{error}</p>
      )}
      {ok && (
        <p className="text-sm text-success sm:col-span-4">Usuário cadastrado.</p>
      )}
    </form>
  );
}

export function UsuariosTable({ usuarios }: { usuarios: Usuario[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-[0.02em] text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">E-mail</th>
            <th className="px-4 py-3 font-semibold">Telefone</th>
            <th className="px-4 py-3 font-semibold">2FA</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <LinhaUsuario key={u.id} usuario={u} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LinhaUsuario({ usuario }: { usuario: Usuario }) {
  const router = useRouter();
  const [telefone, setTelefone] = useState(usuario.telefone ?? "");
  const [pending, start] = useTransition();
  const ativo = usuario.status === "ativo";

  function salvarTelefone() {
    start(async () => {
      await editarTelefone(usuario.id, telefone);
      router.refresh();
    });
  }
  function toggle() {
    start(async () => {
      await alternarStatus(usuario.id, !ativo);
      router.refresh();
    });
  }

  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3">{usuario.email}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="h-8 w-36"
            placeholder="—"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={salvarTelefone}
            disabled={pending || telefone === (usuario.telefone ?? "")}
          >
            Salvar
          </Button>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={
            usuario.two_factor_configured ? "text-success" : "text-muted-foreground"
          }
        >
          {usuario.two_factor_configured ? "Ativo" : "Pendente"}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            ativo
              ? "bg-success/10 text-success"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {ativo ? "ativo" : "inativo"}
        </span>
      </td>
      <td className="px-4 py-3">
        <Button
          type="button"
          variant={ativo ? "ghost" : "secondary"}
          size="sm"
          onClick={toggle}
          disabled={pending}
        >
          {ativo ? "Desativar" : "Ativar"}
        </Button>
      </td>
    </tr>
  );
}
