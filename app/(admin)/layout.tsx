import { UserCog } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { redirect } from "next/navigation";
import { getContaAtual } from "@/lib/conta";
import { ToastProvider } from "@/components/ui/toast";
import { NavProgress } from "@/components/nav-progress";
import { NavLink } from "@/components/nav-link";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { AdminShell } from "@/components/admin-shell";
import { Seal } from "@/components/heraldry/seal";
import { Rule } from "@/components/heraldry/ornaments";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const conta = await getContaAtual();
  // Enquanto a senha for a do cadastro, o único caminho é trocá-la (0016).
  if (conta.senhaTemporaria) redirect("/trocar-senha");

  return (
    <ToastProvider>
    <NavProgress>
    <AdminShell
      sidebar={
        <>
        <div className="flex items-center gap-3 px-5 py-5 text-brand">
          <Seal size={40} />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Karmaleões
            </p>
            <p className="font-display text-lg font-semibold tracking-tight text-foreground">
              Painel
            </p>
          </div>
        </div>
        <Rule className="mx-4 mb-3" />
        <SidebarNav isSuper={conta.isSuper} />
        <div className="mt-auto px-2 pt-2">
          <NavLink
            href="/minha-conta"
            className="mb-2 flex h-9 items-center gap-2 rounded-md px-3 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
          >
            <UserCog className="size-[18px] text-muted-foreground" />
            Minha conta
          </NavLink>
          <ThemeToggle />
        </div>
        <form action={logout} className="p-2">
          <LogoutButton />
        </form>
        </>
      }
    >
      {children}
    </AdminShell>
    </NavProgress>
    </ToastProvider>
  );
}
