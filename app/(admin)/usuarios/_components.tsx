"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/field";
import { PhoneInput } from "@/components/form/phone-input";
import { ShieldBadge } from "@/components/heraldry/shield-badge";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { criarUsuarioSchema } from "@/lib/validation/usuarios";
import { alternarStatus, criarUsuario, editarTelefone } from "./actions";

export type Usuario = {
  id: string;
  email: string;
  telefone: string | null;
  status: string;
  two_factor_configured: boolean;
  user_role: "ADMIN" | "SUPER";
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
  const protegido = (u: Usuario) => protectedIds.includes(u.id);

  const columns: Column<Usuario>[] = [
    {
      key: "email",
      header: "E-mail",
      render: (u) => (
        <span className="inline-flex flex-wrap items-center gap-2 break-all">
          {u.email}
          {u.user_role === "SUPER" && (
            <ShieldBadge tinctura="or">super</ShieldBadge>
          )}
        </span>
      ),
    },
    {
      key: "telefone",
      header: "Telefone",
      // Campo + botão não cabem em meia largura no card do celular.
      cardLargo: true,
      valor: (u) => u.telefone ?? "",
      render: (u) => <CelulaTelefone usuario={u} />,
    },
    {
      key: "two_factor_configured",
      header: "2FA",
      valor: (u) => (u.two_factor_configured ? "ativo" : "pendente"),
      render: (u) => (
        <ShieldBadge tinctura={u.two_factor_configured ? "vert" : "tenne"}>
          {u.two_factor_configured ? "Ativo" : "Pendente"}
        </ShieldBadge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (u) => (
        <ShieldBadge tinctura={u.status === "ativo" ? "vert" : "argent"} escudo>
          {u.status === "ativo" ? "ativo" : "inativo"}
        </ShieldBadge>
      ),
    },
    {
      key: "acoes",
      estatica: true,
      header: "Ações",
      render: (u) =>
        protegido(u) ? (
          <span className="text-xs text-muted-foreground">protegido</span>
        ) : (
          <BotaoStatus usuario={u} />
        ),
    },
  ];

  return (
    <DataTable
      id="usuarios"
      columns={columns}
      rows={usuarios}
      getFilterText={(u) => `${u.email} ${u.telefone ?? ""}`}
      filterPlaceholder="Filtrar usuários…"
      empty="Nenhum usuário cadastrado."
    />
  );
}

/** Telefone é editável na própria linha: campo + salvar. */
function CelulaTelefone({ usuario }: { usuario: Usuario }) {
  const router = useRouter();
  const [telefone, setTelefone] = useState(usuario.telefone ?? "");
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <PhoneInput
        value={telefone}
        onChange={setTelefone}
        className="h-8 w-full md:w-40"
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
  );
}

function BotaoStatus({ usuario }: { usuario: Usuario }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const ativo = usuario.status === "ativo";

  return (
    <Button
      type="button"
      variant={ativo ? "ghost" : "secondary"}
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await alternarStatus(usuario.id, !ativo);
          router.refresh();
        })
      }
    >
      {ativo ? "Desativar" : "Ativar"}
    </Button>
  );
}
