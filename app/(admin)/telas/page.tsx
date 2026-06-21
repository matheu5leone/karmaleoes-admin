import { createClient } from "@/lib/supabase/server";
import { TelasManager, type Tela } from "./_components";

export default async function TelasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tela")
    .select("id, nome, rota, status")
    .order("nome", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Telas</h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Telas do Hub e seu status de exibição. Telas desabilitadas não aparecem
        na navegação.
      </p>
      <TelasManager telas={(data ?? []) as Tela[]} />
    </div>
  );
}
