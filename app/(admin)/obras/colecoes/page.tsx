import { ObrasManager } from "../_components";
import { carregarObras } from "../dados";

export default async function ColecoesPage() {
  const { musicasRows, colecoesRows, colecaoOpts } = await carregarObras();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Coleções</h1>
      <p className="mb-6 mt-1 text-muted-foreground">Álbuns, EPs e singles, ordenados por lançamento.</p>
      <ObrasManager
        secao="colecoes"
        musicas={musicasRows}
        colecoes={colecoesRows}
        colecaoOpts={colecaoOpts}
      />
    </div>
  );
}
