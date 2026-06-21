import { cn } from "@/lib/utils";

/** Placeholder com shimmer para estados de carregamento (DESIGN.md §6/§8). */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton rounded-md", className)} {...props} />;
}

export { Skeleton };
