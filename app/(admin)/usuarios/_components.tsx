"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/field";
import { PhoneInput } from "@/components/form/phone-input";
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
  telefone?: string;
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
        else if (campo === "telefone") fe.telefone ??= issue.message;
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
      <Field label="Telefone (opcional)" htmlFor="novo-tel" error={erros.telefone}>
        <PhoneInput
          id="novo-tel"
          value={telefone}
          onChange={setTelefone}
          aria-invalid={!!erros.telefone}
          className={erros.telefone ? INVALID_INPUT : undefined}
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
    <>
    {/* Cards no celular: 5 colunas com campo editável não cabem em 375px. */}
    <ul className="space-y-3 md:hidden">
      {usuarios.map((u) => (
        <CardUsuario key={u.id} usuario={u} protegido={protectedIds.includes(u.id)} />
      ))}
    </ul>
    <div className="hidden overflow-hidden rounded-lg border border-border md:block">
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
    </>
  );
}

/** Mesma informação da linha, empilhada — versão mobile. */
function CardUsuario({
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

  return (
    <li className="space-y-3 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 break-all font-medium">{usuario.email}</span>
        <ShieldBadge tinctura={ativo ? "vert" : "argent"} escudo>
          {ativo ? "ativo" : "inativo"}
        </ShieldBadge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          2FA
        </span>
        <ShieldBadge tinctura={usuario.two_factor_configured ? "vert" : "tenne"}>
          {usuario.two_factor_configured ? "Ativo" : "Pendente"}
        </ShieldBadge>
      </div>
      <div className="flex items-center gap-2">
        <PhoneInput
          value={telefone}
          onChange={setTelefone}
          className="h-9 flex-1"
          aria-label={`Telefone de ${usuario.email}`}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending || telefone === (usuario.telefone ?? "")}
          onClick={() =>
            start(async () => {
              await editarTelefone(usuario.id, telefone);
              router.refresh();
            })
          }
        >
          Salvar
        </Button>
      </div>
      {protegido ? (
        <p className="text-xs text-muted-foreground">protegido</p>
      ) : (
        <Button
          type="button"
          variant={ativo ? "ghost" : "secondary"}
          size="sm"
          disabled={pending}
          className="w-full"
          onClick={() =>
            start(async () => {
              await alternarStatus(usuario.id, !ativo);
              router.refresh();
            })
          }
        >
          {ativo ? "Desativar" : "Ativar"}
        </Button>
      )}
    </li>
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
          <PhoneInput
            value={telefone}
            onChange={setTelefone}
            className="h-8 w-40"
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
