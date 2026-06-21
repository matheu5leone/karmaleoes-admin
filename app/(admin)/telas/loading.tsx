import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingTelas() {
  return (
    <div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="mt-2 h-4 w-96" />
      <div className="mb-4 mt-6 flex justify-end">
        <Skeleton className="h-10 w-28" />
      </div>
      <Skeleton className="h-9 w-64" />
      <div className="mt-3 overflow-hidden rounded-lg border border-border">
        <div className="flex gap-4 border-b border-border bg-muted/50 px-4 py-3">
          {["w-40", "w-28", "w-16", "w-24"].map((w, i) => (
            <Skeleton key={i} className={`h-3 ${w}`} />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, r) => (
          <div
            key={r}
            className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
          >
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-8 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}
