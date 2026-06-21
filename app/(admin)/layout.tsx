import Link from "next/link";
import {
  CalendarDays,
  Disc3,
  Image as ImageIcon,
  LayoutGrid,
  LogOut,
  Megaphone,
  PlayCircle,
  Users,
} from "lucide-react";
import { logout } from "@/app/(auth)/actions";

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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
            Karmaleões
          </p>
          <p className="text-lg font-semibold tracking-tight">Admin</p>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex h-9 items-center gap-2 rounded-md px-3 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
            >
              <Icon className="size-[18px] text-muted-foreground" />
              {label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-auto p-2">
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
  );
}
