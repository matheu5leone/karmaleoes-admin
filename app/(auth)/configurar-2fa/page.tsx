"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { enrollTotp, verifyEnroll } from "../actions";
import { OtpInput } from "@/components/form/otp-input";
import { Loader2 } from "lucide-react";

export default function ConfigurarDoisFatoresPage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    enrollTotp().then((r) => {
      if (!r.ok) return setError(r.error);
      setFactorId(r.factorId);
      setQr(r.qr);
      setSecret(r.secret);
    });
  }, []);

  /** Dispara assim que os 6 dígitos são preenchidos — sem precisar de Enter. */
  async function verificar(code: string) {
    if (!factorId || loading) return;
    setLoading(true);
    setError(null);
    const r = await verifyEnroll(factorId, code);
    setLoading(false);
    if (!r.ok) {
      // O código TOTP expira: limpa para o usuário digitar o próximo.
      setCodigo("");
      return setError(r.error);
    }
    router.push("/usuarios");
    router.refresh();
  }

  function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (codigo.length === 6) void verificar(codigo);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
          Primeiro acesso
        </p>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight">
          Configurar 2FA
        </h1>

        {!factorId && !error && (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        )}

        {error && (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Link href="/login" className="text-sm text-brand hover:underline">
              Voltar ao login
            </Link>
          </div>
        )}

        {factorId && (
          <form onSubmit={onVerify} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escaneie o QR code no seu app autenticador (Google Authenticator,
              Authy…) e informe o primeiro código.
            </p>
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  qr.trimStart().startsWith("<svg")
                    ? `data:image/svg+xml;utf-8,${encodeURIComponent(qr)}`
                    : qr
                }
                alt="QR code do 2FA"
                className="mx-auto h-44 w-44 rounded-md border border-border bg-card p-2"
              />
            )}
            {secret && (
              <p className="text-center text-xs text-muted-foreground">
                Ou insira manualmente:{" "}
                <span data-testid="totp-secret" className="font-mono text-foreground">
                  {secret}
                </span>
              </p>
            )}
            <OtpInput
              id="codigo"
              value={codigo}
              onChange={setCodigo}
              onComplete={verificar}
              disabled={loading}
              invalid={!!error}
            />
            <div className="min-h-[1.25rem] text-center text-sm" aria-live="polite">
              {loading ? (
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Validando…
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
