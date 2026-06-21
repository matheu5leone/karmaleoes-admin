import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingBanners() {
  return (
    <div>
      <Skeleton className="h-7 w-36" />
      <Skeleton className="mt-2 h-4 w-96" />
      <div className="mb-4 mt-6 flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-9 w-64" />
      <div className="mt-3 overflow-hidden rounded-lg border border-border">
        {Array.from({ length: 5 }).map((_, r) => (
          <div
            key={r}
            className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
          >
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-48" />
          </div>
        ))}
      </div>
    </div>
  );
}
