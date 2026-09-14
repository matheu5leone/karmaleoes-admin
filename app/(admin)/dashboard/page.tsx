import { LayoutDashboard } from "lucide-react";

/**
 * Página de entrada do painel. O dashboard real ainda não foi especificado —
 * por ora é um aviso, mas a rota e o item de menu já existem, então quando o
 * conteúdo chegar só esta página muda.
 */
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Visão geral do Hub Karmaleões.
      </p>
      <div className="flex flex-col items-center gap-3 rounded-sm border border-dashed border-border bg-card px-6 py-16 text-center">
        <LayoutDashboard className="size-8 text-muted-foreground" aria-hidden />
        <p className="font-display text-lg font-semibold">Em construção</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Os indicadores do painel chegam em breve. Enquanto isso, use o menu
          ao lado para gerenciar telas, eventos, obras e conteúdos.
        </p>
      </div>
    </div>
  );
}
