-- =====================================================================
-- Gestão interna da carteira: situação comercial, placas e histórico.
--
-- O `status` que já existia diz se o imóvel aparece no site. Isto é outra
-- coisa: diz em que pé está o negócio e se a placa está no portão. Um
-- imóvel pode estar no ar e já em negociação, ou fora do site e com placa
-- instalada — por isso são campos separados, e não valores novos no
-- mesmo enum.
-- =====================================================================

-- 1. Tipos ---------------------------------------------------------------
do $$ begin
  create type public.situacao_comercial as enum
    ('disponivel', 'negociacao', 'vendido', 'alugado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.placa_situacao as enum
    ('sem_placa', 'pendente', 'com_placa');
exception when duplicate_object then null; end $$;

-- 2. Campos --------------------------------------------------------------
alter table public.properties
  add column if not exists situacao public.situacao_comercial
    not null default 'disponivel',
  add column if not exists responsavel_id uuid
    references public.profiles (id) on delete set null,
  add column if not exists placa public.placa_situacao
    not null default 'sem_placa',
  add column if not exists placa_instalada_em date,
  add column if not exists placa_responsavel_id uuid
    references public.profiles (id) on delete set null,
  add column if not exists placa_foto_url text,
  add column if not exists placa_foto_path text,
  add column if not exists placa_obs text;

alter table public.properties
  drop constraint if exists properties_placa_obs_tamanho;
alter table public.properties
  add constraint properties_placa_obs_tamanho
  check (length(placa_obs) <= 2000);

-- 3. Histórico -----------------------------------------------------------
-- Quem mudou a situação ou a placa, e quando. Ninguém escreve aqui pela
-- API: as linhas nascem do gatilho abaixo, então o histórico não pode ser
-- forjado nem apagado pelo painel.
create table if not exists public.property_events (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  autor_id    uuid references public.profiles (id) on delete set null,
  campo       text not null,
  de          text,
  para        text,
  nota        text,
  created_at  timestamptz not null default now(),
  constraint property_events_campo check (campo in ('situacao', 'placa'))
);

create index if not exists property_events_imovel_idx
  on public.property_events (property_id, created_at desc);

alter table public.property_events enable row level security;

drop policy if exists "equipe le historico" on public.property_events;
create policy "equipe le historico" on public.property_events
  for select to authenticated using (public.is_staff());

-- Só leitura, e só para quem entrou. O visitante não recebe nada.
grant select on public.property_events to authenticated;

-- 4. Gatilho do histórico ------------------------------------------------
create or replace function public.registra_evento_imovel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- O autor sai de uma subconsulta, e não de auth.uid() direto: se por
  -- algum motivo a pessoa não tiver perfil, o evento entra sem autor em
  -- vez de a chave estrangeira derrubar o salvamento do imóvel.
  if new.situacao is distinct from old.situacao then
    insert into public.property_events (property_id, autor_id, campo, de, para)
    values (
      new.id,
      (select p.id from public.profiles p where p.id = auth.uid()),
      'situacao',
      old.situacao::text,
      new.situacao::text
    );
  end if;

  if new.placa is distinct from old.placa then
    insert into public.property_events (property_id, autor_id, campo, de, para, nota)
    values (
      new.id,
      (select p.id from public.profiles p where p.id = auth.uid()),
      'placa',
      old.placa::text,
      new.placa::text,
      new.placa_obs
    );
  end if;

  return null;
end;
$$;

revoke execute on function public.registra_evento_imovel()
  from public, anon, authenticated;

drop trigger if exists properties_historico on public.properties;
create trigger properties_historico
  after update of situacao, placa on public.properties
  for each row execute function public.registra_evento_imovel();

-- 5. Índices -------------------------------------------------------------
-- "Disponíveis sem placa" é a consulta que a equipe vai fazer todo dia, e
-- é seletiva: o índice parcial cobre só essa fatia.
create index if not exists properties_placa_idx
  on public.properties (placa) where situacao = 'disponivel';

-- O mapa desenha apenas quem tem coordenada.
create index if not exists properties_coordenada_idx
  on public.properties (latitude, longitude) where latitude is not null;

create index if not exists properties_responsavel_idx
  on public.properties (responsavel_id) where responsavel_id is not null;

-- placa_responsavel_id fica sem índice de propósito: ninguém filtra por
-- ele, e a carteira é pequena demais para o apagamento de um perfil doer.

-- 6. O que é público e o que é interno -----------------------------------
-- A migração 0004 deu "select on properties" para anon, e permissão de
-- tabela vale para todas as colunas — inclusive as que acabaram de
-- entrar. Em Postgres não se revoga uma coluna de uma permissão de
-- tabela: ela sai inteira e voltam só as colunas públicas, nomeadas uma a
-- uma.
--
-- O efeito colateral é bem-vindo: coluna nova nasce fechada para o
-- visitante, e um "select *" com a chave pública passa a dar erro em vez
-- de vazar. Se algum dia um campo novo precisar ser público, ele entra
-- nesta lista — e o site reclama alto enquanto não entrar.
--
-- created_by também fica de fora: é o id de quem cadastrou, informação de
-- equipe que o site nunca usou e que vinha saindo no "select *" da ficha.
revoke select on public.properties from anon;

grant select (
  id, ref, slug, titulo, subtitulo, tipo, listing, status, stage,
  cidade, uf, bairro, endereco, latitude, longitude, mostrar_endereco,
  preco, preco_anterior, condominio, iptu, preco_sob_consulta,
  dormitorios, suites, banheiros, vagas, area_total, area_privativa,
  descricao, badge, alto_padrao, mobiliado, destaque, ordem,
  meta_title, meta_description, visualizacoes, cliques_whatsapp,
  created_at, updated_at, busca, mapa_url, mapa_embed
) on public.properties to anon;

-- 7. Nomes da equipe, e só os nomes ---------------------------------------
-- Para escolher o responsável, o painel precisa da lista de quem trabalha
-- na imobiliária. Mas a política de profiles é estreita de propósito: cada
-- um vê o seu, e só o admin vê todos — ninguém precisa do telefone, do
-- e-mail e do CRECI dos colegas.
--
-- Esta função devolve exatamente dois campos. Abrir a tabela inteira para
-- a equipe resolveria do mesmo jeito e entregaria muito mais.
create or replace function public.equipe_nomes()
returns table (id uuid, nome text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.nome
  from public.profiles p
  where p.ativo and public.is_staff()
  order by p.nome;
$$;

revoke execute on function public.equipe_nomes() from public, anon;
grant execute on function public.equipe_nomes() to authenticated;
