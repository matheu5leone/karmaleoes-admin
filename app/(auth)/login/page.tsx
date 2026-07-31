"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { challengeTotp, signIn } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  async function onChallenge(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const r = await challengeTotp(factorId, codigo);
    setLoading(false);
    if (!r.ok) return setError(r.error);
    router.push("/usuarios");
    router.refresh();
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
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código TOTP</Label>
              <Input
                id="codigo"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verificando..." : "Verificar"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
