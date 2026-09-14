import { redirect } from "next/navigation";

// Músicas e coleções ganharam páginas próprias no menu lateral.
export default function ObrasPage() {
  redirect("/obras/musicas");
}
