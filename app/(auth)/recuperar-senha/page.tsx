"use client";

import { useState } from "react";
import Link from "next/link";
import { requestReset } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await requestReset(email);
    setLoading(false);
    setEnviado(true);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">
          Recuperar senha
        </h1>
        {enviado ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Se o e-mail estiver cadastrado, enviamos um link de redefinição.
              Verifique sua caixa de entrada.
            </p>
            <Link href="/login" className="text-sm text-brand hover:underline">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link"}
            </Button>
            <p className="text-center text-sm">
              <Link href="/login" className="text-brand hover:underline">
                Voltar ao login
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
