import { ObrasManager } from "../_components";
import { carregarObras } from "../dados";

export default async function MusicasPage() {
  const { musicasRows, colecoesRows, colecaoOpts } = await carregarObras();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Músicas</h1>
      <p className="mb-6 mt-1 text-muted-foreground">Faixas da banda, ordenadas por lançamento.</p>
      <ObrasManager
        secao="musicas"
        musicas={musicasRows}
        colecoes={colecoesRows}
        colecaoOpts={colecaoOpts}
      />
    </div>
  );
}
