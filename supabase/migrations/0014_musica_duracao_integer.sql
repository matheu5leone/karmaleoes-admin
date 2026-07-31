-- 0014_musica_duracao_integer.sql
-- musica.duracao passa de texto 'mm:ss' para integer (segundos), fiel ao DER
-- (SONGS.duration_seconds). Converte os valores existentes; formato inválido → null.

alter table public.musica
  alter column duracao type integer
  using (
    case
      when duracao ~ '^[0-9]+:[0-5][0-9]$'
      then split_part(duracao, ':', 1)::int * 60 + split_part(duracao, ':', 2)::int
      else null
    end
  );
