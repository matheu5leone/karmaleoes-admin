-- Limite de caracteres nos campos de nome/título.
--
-- A validação do Zod já barra no painel, mas quem escreve direto no Supabase
-- passava por cima dela — e passou: havia nomes de 339, 671 e 1026 caracteres,
-- todos teclado-amassado de teste.
--
-- Os números vivem também em lib/validation/limites.ts; mudar um lado pede
-- mudar o outro.
--
-- `not valid` de propósito: a constraint vale para todo INSERT e UPDATE a
-- partir de agora, mas não reprova as linhas que já existem — assim a migração
-- não falha por causa do lixo antigo. Depois de limpar essas linhas, dá para
-- validar o histórico com:
--   alter table public.<tabela> validate constraint <nome_da_constraint>;

alter table public.tela
  add constraint tela_nome_tamanho check (char_length(nome) <= 70) not valid;

alter table public.marquee
  add constraint marquee_nome_tamanho check (char_length(nome) <= 70) not valid;

alter table public.marquee_item
  add constraint marquee_item_titulo_tamanho check (char_length(titulo) <= 70) not valid;

alter table public.banner
  add constraint banner_nome_tamanho check (char_length(nome) <= 70) not valid;

alter table public.evento
  add constraint evento_nome_tamanho check (char_length(nome) <= 120) not valid;

alter table public.musica
  add constraint musica_nome_tamanho check (char_length(nome) <= 120) not valid;

alter table public.colecao
  add constraint colecao_nome_tamanho check (char_length(nome) <= 120) not valid;

alter table public.colaborador
  add constraint colaborador_nome_tamanho check (char_length(nome) <= 200) not valid;

alter table public.role
  add constraint role_nome_tamanho check (char_length(nome) <= 200) not valid;

alter table public.conteudo
  add constraint conteudo_titulo_tamanho check (char_length(titulo) <= 120) not valid;

-- Categorias: a de eventos e a de conteúdos seguem o mesmo limite.
alter table public.category
  add constraint category_name_tamanho check (char_length(name) <= 70) not valid;

alter table public.categoria_conteudo
  add constraint categoria_conteudo_nome_tamanho check (char_length(nome) <= 70) not valid;

alter table public.status_evento
  add constraint status_evento_nome_tamanho check (char_length(nome) <= 70) not valid;
