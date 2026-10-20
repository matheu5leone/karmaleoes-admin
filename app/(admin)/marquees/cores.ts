"use server";

import { createClient } from "@/lib/supabase/server";

export type CorPredefinida = { nome: string; hex: string };

/** Paleta sugerida no seletor (tabela `cor_predefinida`, editada no Supabase). */
export async function getCoresPredefinidas(): Promise<CorPredefinida[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cor_predefinida")
    .select("nome, hex")
    .order("ordem");
  return (data ?? []) as CorPredefinida[];
}
