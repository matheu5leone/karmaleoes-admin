"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/field";
import { ShieldBadge } from "@/components/heraldry/shield-badge";
import { criarUsuarioSchema } from "@/lib/validation/usuarios";
import { alternarStatus, criarUsuario, editarTelefone } from "./actions";

export type Usuario = {
  id: string;
  email: string;
  telefone: string | null;
  status: string;
  two_factor_configured: boolean;
};

type NovoUsuarioErros = {
  email?: string;
  senhaTemporaria?: string;
  form?: string;
};

/** Borda/anel vermelho para o campo inválido. */
const INVALID_INPUT =
  "border-destructive hover:border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30";

export function NovoUsuario() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState<NovoUsuarioErros>({});
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setOk(false);
    setErros({});

    // Validação no cliente → feedback imediato no campo certo.
    const parsed = criarUsuarioSchema.safeParse({
      email,
      telefone,
      senhaTemporaria: senha,
    });
    if (!parsed.success) {
      const fe: NovoUsuarioErros = {};
      for (const issue of parsed.error.issues) {
        const campo = issue.path[0];
        if (campo === "email") fe.email ??= issue.message;
        else if (campo === "senhaTemporaria") fe.senhaTemporaria ??= issue.message;
        else fe.form ??= issue.message;
      }
      return setErros(fe);
    }

    start(async () => {
      const r = await criarUsuario({ email, telefone, senhaTemporaria: senha });
      if (!r.ok) {
        // Erro de e-mail duplicado → no campo de e-mail; demais (config etc.) → geral.
        return setErros(
          /mail/i.test(r.error) ? { email: r.error } : { form: r.error },
        );
      }
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
      noValidate
      className="mb-8 grid gap-x-3 gap-y-2 rounded-lg border border-border bg-card p-4 sm:grid-cols-4 sm:items-start"
    >
      <Field label="E-mail *" htmlFor="novo-email" error={erros.email}>
        <Input
          id="novo-email"
          type="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!erros.email}
          className={erros.email ? INVALID_INPUT : undefined}
        />
      </Field>
      <Field label="Telefone (opcional)" htmlFor="novo-tel">
        <Input
          id="novo-tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
      </Field>
      <Field
        label="Senha temporária *"
        htmlFor="novo-senha"
        error={erros.senhaTemporaria}
      >
        <Input
          id="novo-senha"
          type="text"
          autoComplete="off"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Mínimo de 8 caracteres"
          aria-invalid={!!erros.senhaTemporaria}
          className={erros.senhaTemporaria ? INVALID_INPUT : undefined}
        />
      </Field>
      <div className="space-y-1.5">
        <span aria-hidden className="hidden text-sm sm:block">
          &nbsp;
        </span>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Cadastrando..." : "Cadastrar"}
        </Button>
      </div>

      {erros.form && (
        <p className="text-sm text-destructive sm:col-span-4">{erros.form}</p>
      )}
      {ok && (
        <p className="text-sm text-success sm:col-span-4">Usuário cadastrado.</p>
      )}
    </form>
  );
}

export function UsuariosTable({
  usuarios,
  protectedIds = [],
}: {
  usuarios: Usuario[];
  protectedIds?: string[];
}) {
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
            <LinhaUsuario
              key={u.id}
              usuario={u}
              protegido={protectedIds.includes(u.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LinhaUsuario({
  usuario,
  protegido,
}: {
  usuario: Usuario;
  protegido: boolean;
}) {
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
        <ShieldBadge tinctura={usuario.two_factor_configured ? "vert" : "tenne"}>
          {usuario.two_factor_configured ? "Ativo" : "Pendente"}
        </ShieldBadge>
      </td>
      <td className="px-4 py-3">
        <ShieldBadge tinctura={ativo ? "vert" : "argent"} escudo>
          {ativo ? "ativo" : "inativo"}
        </ShieldBadge>
      </td>
      <td className="px-4 py-3">
        {protegido ? (
          <span className="text-xs text-muted-foreground">protegido</span>
        ) : (
          <Button
            type="button"
            variant={ativo ? "ghost" : "secondary"}
            size="sm"
            onClick={toggle}
            disabled={pending}
          >
            {ativo ? "Desativar" : "Ativar"}
          </Button>
        )}
      </td>
    </tr>
  );
}
