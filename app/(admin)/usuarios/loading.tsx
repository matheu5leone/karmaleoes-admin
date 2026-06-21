import { Skeleton } from "@/components/ui/skeleton";

// Exibido automaticamente (Suspense) enquanto a página busca os usuários.
export default function LoadingUsuarios() {
  return (
    <div>
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-80" />

      {/* Card do formulário de cadastro */}
      <div className="mb-8 mt-6 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-4 sm:items-end">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-full sm:w-28" />
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="flex items-center gap-4 border-b border-border bg-muted/50 px-4 py-3">
          {["w-40", "w-28", "w-12", "w-16", "w-20"].map((w, i) => (
            <Skeleton key={i} className={`h-3 ${w}`} />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, r) => (
          <div
            key={r}
            className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
          >
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
