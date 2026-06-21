// Placeholder do login (Plano 00). A UI real (e-mail+senha+TOTP) entra no Plano 01.
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
        Painel Administrativo
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Entrar
      </h1>
      <p className="mt-4 max-w-sm text-muted-foreground">
        Autenticação em construção (Plano 01: e-mail + senha + 2FA).
      </p>
    </main>
  );
}
