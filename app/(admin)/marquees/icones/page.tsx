import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { IconesManager, type IconRow } from "./_components";

export default async function IconesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("icons")
    .select("id, name, extension")
    .order("name", { ascending: true });

  return (
    <div>
      <Link href="/marquees" className="text-sm text-brand hover:underline">
        ← Marquees
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Ícones</h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Conjunto de ícones (arquivos em <code>/public/icons/</code>), usados nos
        itens de marquee. A imagem é resolvida por{" "}
        <code>/icons/&lt;name&gt;.&lt;extension&gt;</code>.
      </p>
      <IconesManager icons={(data ?? []) as IconRow[]} />
    </div>
  );
}
