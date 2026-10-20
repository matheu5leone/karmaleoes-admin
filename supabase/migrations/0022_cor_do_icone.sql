-- Cor do ícone do item de marquee.
--
-- A cor fica no item (e não no ícone) porque o mesmo arquivo serve a marquees
-- de paletas diferentes: a estrela pode sair dourada numa fita e branca na
-- outra. `null` = o arquivo aparece com as cores próprias.
alter table public.marquee_item
  add column if not exists cor_icone text;

alter table public.marquee_item
  add constraint marquee_item_cor_icone_hex
  check (cor_icone is null or cor_icone ~ '^#[0-9a-fA-F]{6}$');

comment on column public.marquee_item.cor_icone is
  'Cor aplicada ao ícone (#RRGGBB). Null mantém as cores do arquivo.';

-- Paleta sugerida no seletor. É lookup como `icons`: quem edita é o Supabase.
create table if not exists public.cor_predefinida (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  hex text not null check (hex ~ '^#[0-9a-fA-F]{6}$'),
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cor_predefinida is
  'Cores sugeridas no seletor de cor do ícone de marquee.';

alter table public.cor_predefinida enable row level security;

create policy admin_full_access on public.cor_predefinida
  for all to authenticated
  using (is_active_admin())
  with check (is_active_admin());

-- Tincturas do DESIGN.md: o painel inteiro já fala essa paleta.
insert into public.cor_predefinida (nome, hex, ordem) values
  ('Ouro',      '#d7a93f', 1),
  ('Pergaminho','#f2e9d8', 2),
  ('Argent',    '#ffffff', 3),
  ('Sable',     '#1d1812', 4),
  ('Gules',     '#a8282a', 5),
  ('Vert',      '#2a6140', 6),
  ('Azure',     '#2f5a8c', 7),
  ('Tenné',     '#8a4a1c', 8),
  ('Purpure',   '#6d3f6d', 9)
on conflict do nothing;
