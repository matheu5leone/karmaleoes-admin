import Link from "next/link";
import { getContaAtual } from "@/lib/conta";
import { getResumo } from "./dados";
import {
  Agenda,
  Atividade,
  Capas,
  Cobertura,
  NoAr,
  Numeros,
  Operacao,
  Painel,
  Pendencias,
  Ranking,
} from "./_components";

/**
 * Entrada do painel: o que está no ar agora, o que falta fazer e como anda o
 * acervo. Tudo sai das tabelas que o próprio painel mantém — não há métrica de
 * audiência porque o site público não envia eventos para cá.
 */
export default async function DashboardPage() {
  const { isSuper } = await getContaAtual();
  const r = await getResumo(isSuper);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Visão geral do Hub Karmaleões.</p>
      </div>

      <Numeros n={r.numeros} />

      <Painel
        titulo="No ar agora"
        acao={
          <Link href="/telas" className="text-xs text-brand hover:underline">
            Telas
          </Link>
        }
      >
        <NoAr telas={r.telas} />
      </Painel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Painel titulo="Precisa de atenção">
          <Pendencias itens={r.pendencias} />
        </Painel>

        <Painel
          titulo="Agenda"
          acao={
            <Link href="/eventos" className="text-xs text-brand hover:underline">
              Eventos
            </Link>
          }
        >
          <Agenda agenda={r.agenda} />
        </Painel>
      </div>

      <Painel
        titulo="Catálogo"
        acao={
          <Link href="/obras" className="text-xs text-brand hover:underline">
            Obras
          </Link>
        }
      >
        <div className="space-y-5">
          <Capas capas={r.catalogo.capas} />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Fichas completas
              </p>
              <Cobertura itens={r.catalogo.cobertura} />
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Quem mais aparece
              </p>
              <Ranking
                itens={r.catalogo.topColaboradores}
                vazio="Nenhum colaborador vinculado."
              />
            </div>
          </div>
        </div>
      </Painel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Painel titulo="Operação">
          <Operacao op={r.operacao} />
        </Painel>

        {r.atividade && (
          <Painel
            titulo="Atividade"
            acao={
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                super admin
              </span>
            }
          >
            <Atividade a={r.atividade} />
          </Painel>
        )}
      </div>
    </div>
  );
}
