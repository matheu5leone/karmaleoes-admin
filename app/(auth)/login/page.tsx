"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { challengeTotp, signIn } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/form/otp-input";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"login" | "challenge">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [factorId, setFactorId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const r = await signIn({ email, senha });
    setLoading(false);
    if (!r.ok) return setError(r.error);
    if (r.step === "enroll") router.push("/configurar-2fa");
    else {
      setFactorId(r.factorId);
      setStep("challenge");
    }
  }

  /** Dispara assim que os 6 dígitos são preenchidos — sem precisar de Enter. */
  async function verificar(code: string) {
    if (loading) return;
    setLoading(true);
    setError(null);
    const r = await challengeTotp(factorId, code);
    setLoading(false);
    if (!r.ok) {
      // O código TOTP expira: limpa para o usuário digitar o próximo.
      setCodigo("");
      return setError(r.error);
    }
    router.push("/usuarios");
    router.refresh();
  }

  function onChallenge(e: React.FormEvent) {
    e.preventDefault();
    if (codigo.length === 6) void verificar(codigo);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
          Painel Administrativo
        </p>
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">
          {step === "login" ? "Entrar" : "Verificação 2FA"}
        </h1>

        {step === "login" ? (
          <form onSubmit={onLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-center text-sm">
              <Link href="/recuperar-senha" className="text-brand hover:underline">
                Esqueci minha senha
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={onChallenge} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Informe o código de 6 dígitos do seu aplicativo autenticador.
            </p>
            <OtpInput
              id="codigo"
              value={codigo}
              onChange={setCodigo}
              onComplete={verificar}
              disabled={loading}
              invalid={!!error}
              autoFocus
            />
            <div className="min-h-[1.25rem] text-center text-sm" aria-live="polite">
              {loading ? (
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Verificando…
                </span>
              ) : error ? (
                <span className="text-destructive">{error}</span>
              ) : null}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
