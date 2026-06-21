export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
        Painel Administrativo
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">
        Karmaleões
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Ambiente em configuração. Stack base (Next.js · Supabase · Redis) ativa.
      </p>
      <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-subtle px-4 py-1.5 text-sm text-brand">
        <span className="inline-block h-2 w-2 rounded-full bg-success" aria-hidden />
        localhost operacional
      </div>
    </main>
  );
}
