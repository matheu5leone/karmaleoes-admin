import {
  CalendarDays,
  Disc3,
  History,
  Image as ImageIcon,
  LayoutGrid,
  LogOut,
  Megaphone,
  PlayCircle,
  Users,
} from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { isRootAdmin } from "@/lib/root-admin";
import { ToastProvider } from "@/components/ui/toast";
import { NavProgress } from "@/components/nav-progress";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Seal } from "@/components/heraldry/seal";
import { Rule } from "@/components/heraldry/ornaments";

// Shell administrativo (Plano 00). Navegação placeholder — itens habilitados
// conforme os módulos forem entregues. Tokens/estilo seguem DESIGN.md.
const NAV = [
  { href: "/usuarios", label: "Usuários", icon: Users },
  { href: "/telas", label: "Telas", icon: LayoutGrid },
  { href: "/marquees", label: "Marquees", icon: Megaphone },
  { href: "/banners", label: "Banners", icon: ImageIcon },
  { href: "/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/conteudos", label: "Conteúdos", icon: PlayCircle },
  { href: "/obras", label: "Obras", icon: Disc3 },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Histórico é exclusivo do administrador raiz (RLS em audit_log, migration 0015).
  const nav = (await isRootAdmin())
    ? [...NAV, { href: "/historico", label: "Histórico", icon: History }]
    : NAV;

  return (
    <ToastProvider>
    <NavProgress>
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
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
        <nav className="flex flex-col gap-1 px-2">
          {nav.map(({ href, label, icon: Icon }) => (
            <NavLink
              key={href}
              href={href}
              className="flex h-9 items-center gap-2 rounded-md px-3 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
            >
              <Icon className="size-[18px] text-muted-foreground" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-2 pt-2">
          <ThemeToggle />
        </div>
        <form action={logout} className="p-2">
          <button
            type="submit"
            className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="size-[18px] text-muted-foreground" />
            Sair
          </button>
        </form>
      </aside>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
    </NavProgress>
    </ToastProvider>
  );
}
