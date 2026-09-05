"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/field";
import { alterarSenhaSchema } from "@/lib/validation/usuarios";
import { alterarSenha } from "@/app/(admin)/minha-conta/actions";

type Erros = {
  senhaAtual?: string;
  novaSenha?: string;
  confirmar?: string;
  form?: string;
};

const INVALIDO =
  "border-destructive hover:border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30";

/**
 * Formulário de troca de senha, usado tanto na página "Minha conta" quanto na
 * troca obrigatória do 1º acesso (`redirectTo` muda o destino ao concluir).
 */
export function AlterarSenhaForm({
  redirectTo,
  labelBotao = "Alterar senha",
}: {
  redirectTo: string;
  labelBotao?: string;
}) {
  const router = useRouter();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erros, setErros] = useState<Erros>({});
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setOk(false);
    setErros({});

    const parsed = alterarSenhaSchema.safeParse({
      senhaAtual,
      novaSenha,
      confirmar,
    });
    if (!parsed.success) {
      const fe: Erros = {};
      for (const issue of parsed.error.issues) {
        const campo = issue.path[0];
        if (campo === "senhaAtual") fe.senhaAtual ??= issue.message;
        else if (campo === "novaSenha") fe.novaSenha ??= issue.message;
        else if (campo === "confirmar") fe.confirmar ??= issue.message;
        else fe.form ??= issue.message;
      }
      return setErros(fe);
    }

    start(async () => {
      const r = await alterarSenha({ senhaAtual, novaSenha, confirmar });
      if (!r.ok) {
        return setErros(
          /atual/i.test(r.error) ? { senhaAtual: r.error } : { form: r.error },
        );
      }
      setOk(true);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmar("");
      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="max-w-sm space-y-4">
      <Field label="Senha atual" htmlFor="s-atual" error={erros.senhaAtual}>
        <Input
          id="s-atual"
          type="password"
          autoComplete="current-password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          aria-invalid={!!erros.senhaAtual}
          className={erros.senhaAtual ? INVALIDO : undefined}
        />
      </Field>
      <Field label="Nova senha" htmlFor="s-nova" error={erros.novaSenha}>
        <Input
          id="s-nova"
          type="password"
          autoComplete="new-password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          placeholder="Mínimo de 8 caracteres"
          aria-invalid={!!erros.novaSenha}
          className={erros.novaSenha ? INVALIDO : undefined}
        />
      </Field>
      <Field label="Confirmar nova senha" htmlFor="s-conf" error={erros.confirmar}>
        <Input
          id="s-conf"
          type="password"
          autoComplete="new-password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          aria-invalid={!!erros.confirmar}
          className={erros.confirmar ? INVALIDO : undefined}
        />
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Alterando…
          </span>
        ) : (
          labelBotao
        )}
      </Button>

      {erros.form && <p className="text-sm text-destructive">{erros.form}</p>}
      {ok && <p className="text-sm text-success">Senha alterada.</p>}
      <p className="text-xs text-muted-foreground">
        Ao alterar, as demais sessões desta conta são encerradas.
      </p>
    </form>
  );
}
