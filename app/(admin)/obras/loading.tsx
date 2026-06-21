import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingObras() {
  return (
    <div>
      <Skeleton className="h-7 w-28" />
      <Skeleton className="mt-2 h-4 w-72" />
      {[0, 1].map((s) => (
        <div key={s} className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            {Array.from({ length: 4 }).map((_, r) => (
              <div
                key={r}
                className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
              >
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-48" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
