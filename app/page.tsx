import { redirect } from "next/navigation";

// A raiz não tem conteúdo próprio: leva à aplicação. Sem sessão, o middleware
// das rotas (admin) redireciona para /login.
export default function Home() {
  redirect("/usuarios");
}
