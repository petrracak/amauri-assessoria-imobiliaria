-- =====================================================================
-- Amauri Assessoria Imobiliária — schema inicial
-- =====================================================================

create extension if not exists "unaccent" with schema extensions;

-- unaccent() é STABLE, e coluna gerada exige IMMUTABLE.
-- Este wrapper qualificado resolve isso sem depender do search_path.
create or replace function public.f_unaccent(text)
  returns text language sql immutable strict parallel safe as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1);
$$;

-- ---------------------------------------------------------------- tipos
create type public.user_role         as enum ('admin', 'corretor');
create type public.property_status   as enum ('rascunho', 'publicado', 'arquivado');
create type public.listing_kind      as enum ('venda', 'aluguel');
create type public.construction_stage as enum ('lancamento', 'em_construcao', 'pronto');
create type public.post_status       as enum ('rascunho', 'publicado');
create type public.lead_status       as enum ('novo', 'em_contato', 'convertido', 'descartado');

-- ------------------------------------------------------------- perfis
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nome       text not null,
  email      text,
  telefone   text,
  avatar_url text,
  creci      text,
  role       public.user_role not null default 'corretor',
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Funções de permissão. SECURITY DEFINER evita recursão de RLS em profiles.
create or replace function public.is_staff() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and ativo
  );
$$;

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and ativo and role = 'admin'
  );
$$;

-- Cria o perfil automaticamente quando alguém é convidado/cadastrado.
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'corretor')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at automático
create or replace function public.touch_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ------------------------------------------------------------ imóveis
create table public.properties (
  id              uuid primary key default gen_random_uuid(),
  ref             text not null unique,            -- 035, 026 (o "#" do site antigo)
  slug            text not null unique,
  titulo          text not null,
  subtitulo       text,
  tipo            text not null,                   -- Apartamento, Casa em Condomínio, Terreno...
  listing         public.listing_kind not null default 'venda',
  status          public.property_status not null default 'rascunho',
  stage           public.construction_stage,

  -- localização
  cidade          text not null default 'Santarém',
  uf              text not null default 'PA',
  bairro          text,
  endereco        text,
  latitude        numeric(10, 7),
  longitude       numeric(10, 7),
  mostrar_endereco boolean not null default true,

  -- valores
  preco           numeric(14, 2),
  preco_anterior  numeric(14, 2),                  -- para exibir desconto
  condominio      numeric(14, 2),
  iptu            numeric(14, 2),
  preco_sob_consulta boolean not null default false,

  -- números
  dormitorios     smallint,
  suites          smallint,
  banheiros       smallint,
  vagas           smallint,
  area_total      numeric(10, 2),
  area_privativa  numeric(10, 2),

  -- conteúdo
  descricao       text,
  badge           text,                            -- "PORTEIRA FECHADA", "ÚLTIMAS UNIDADES"
  alto_padrao     boolean not null default false,
  mobiliado       text,                            -- Mobiliado, Semimobiliado, Sem Mobília
  destaque        boolean not null default false,
  ordem           integer not null default 0,

  -- seo
  meta_title      text,
  meta_description text,

  -- métricas
  visualizacoes   integer not null default 0,
  cliques_whatsapp integer not null default 0,

  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint preco_positivo check (preco is null or preco >= 0),
  constraint areas_positivas check (
    (area_total is null or area_total >= 0) and
    (area_privativa is null or area_privativa >= 0)
  )
);

create trigger properties_touch before update on public.properties
  for each row execute function public.touch_updated_at();

-- Busca textual (título + bairro + descrição + ref), sem acento.
alter table public.properties add column busca tsvector
  generated always as (
    to_tsvector('portuguese',
      public.f_unaccent(
        coalesce(ref, '') || ' ' || coalesce(titulo, '') || ' ' ||
        coalesce(bairro, '') || ' ' || coalesce(tipo, '') || ' ' ||
        coalesce(descricao, '')
      )
    )
  ) stored;

create index properties_busca_idx     on public.properties using gin (busca);
create index properties_vitrine_idx   on public.properties (status, destaque desc, ordem, created_at desc);
create index properties_bairro_idx    on public.properties (bairro) where status = 'publicado';
create index properties_tipo_idx      on public.properties (tipo)   where status = 'publicado';
create index properties_preco_idx     on public.properties (preco)  where status = 'publicado';

-- ------------------------------------------------------- fotos do imóvel
create table public.property_images (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  url         text not null,
  path        text,                                -- caminho no storage, para deletar depois
  alt         text,
  largura     integer,
  altura      integer,
  blur_hash   text,                                -- placeholder enquanto carrega
  ordem       integer not null default 0,
  capa        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index property_images_idx on public.property_images (property_id, ordem);
create unique index property_images_capa_idx
  on public.property_images (property_id) where capa;

-- ------------------------------------------------- características
create table public.features (
  id     uuid primary key default gen_random_uuid(),
  nome   text not null unique,
  grupo  text not null default 'imovel',           -- 'imovel' | 'empreendimento'
  icone  text,
  ordem  integer not null default 0
);

create table public.property_features (
  property_id uuid not null references public.properties (id) on delete cascade,
  feature_id  uuid not null references public.features (id) on delete cascade,
  primary key (property_id, feature_id)
);

create index property_features_feature_idx on public.property_features (feature_id);

-- ---------------------------------------------------------------- blog
create table public.posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  titulo        text not null,
  resumo        text,
  conteudo      text,
  capa_url      text,
  capa_path     text,
  categoria     text,
  status        public.post_status not null default 'rascunho',
  publicado_em  timestamptz,
  meta_title    text,
  meta_description text,
  visualizacoes integer not null default 0,
  autor_id      uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

create index posts_publicados_idx on public.posts (status, publicado_em desc);

-- --------------------------------------------------------------- leads
create table public.leads (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  whatsapp    text not null,
  email       text,
  mensagem    text,
  origem      text,                                -- 'newsletter', 'ficha-imovel', 'contato'
  property_id uuid references public.properties (id) on delete set null,
  status      public.lead_status not null default 'novo',
  anotacoes   text,
  consentimento boolean not null default true,     -- LGPD: aceite explícito
  utm         jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();

create index leads_recentes_idx on public.leads (created_at desc);
create index leads_status_idx   on public.leads (status, created_at desc);

-- ------------------------------------------------ configurações do site
-- Chave/valor para o painel editar sem mexer em código (pixels, contatos, textos).
create table public.site_settings (
  chave       text primary key,
  valor       jsonb not null default '{}'::jsonb,
  descricao   text,
  publico     boolean not null default true,       -- false = só o painel enxerga
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null
);

create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.profiles          enable row level security;
alter table public.properties        enable row level security;
alter table public.property_images   enable row level security;
alter table public.features          enable row level security;
alter table public.property_features enable row level security;
alter table public.posts             enable row level security;
alter table public.leads             enable row level security;
alter table public.site_settings     enable row level security;

-- perfis: cada um vê o seu; admin vê e gerencia todos
create policy "perfil proprio" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "edita proprio perfil" on public.profiles
  for update to authenticated using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
create policy "admin gerencia perfis" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- imóveis: o site mostra publicados; a equipe gerencia tudo
create policy "publicos visiveis" on public.properties
  for select to anon, authenticated using (status = 'publicado' or public.is_staff());
create policy "equipe gerencia imoveis" on public.properties
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "fotos visiveis" on public.property_images
  for select to anon, authenticated using (
    public.is_staff() or exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'publicado'
    )
  );
create policy "equipe gerencia fotos" on public.property_images
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "features visiveis" on public.features
  for select to anon, authenticated using (true);
create policy "equipe gerencia features" on public.features
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "vinculos visiveis" on public.property_features
  for select to anon, authenticated using (true);
create policy "equipe gerencia vinculos" on public.property_features
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- blog
create policy "posts publicados" on public.posts
  for select to anon, authenticated using (status = 'publicado' or public.is_staff());
create policy "equipe gerencia posts" on public.posts
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- leads: qualquer visitante cadastra, só a equipe lê
create policy "visitante cadastra lead" on public.leads
  for insert to anon, authenticated with check (true);
create policy "equipe le leads" on public.leads
  for select to authenticated using (public.is_staff());
create policy "equipe atualiza leads" on public.leads
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "admin apaga leads" on public.leads
  for delete to authenticated using (public.is_admin());

-- configurações
create policy "config publica" on public.site_settings
  for select to anon, authenticated using (publico or public.is_staff());
create policy "admin edita config" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Storage
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('imoveis', 'imoveis', true, 15728640,
   array['image/jpeg','image/png','image/webp','image/avif']),
  ('blog',    'blog',    true, 10485760,
   array['image/jpeg','image/png','image/webp','image/avif']),
  ('site',    'site',    true, 10485760,
   array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml'])
on conflict (id) do nothing;

create policy "imagens publicas" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('imoveis', 'blog', 'site'));

create policy "equipe envia imagens" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('imoveis', 'blog', 'site') and public.is_staff());

create policy "equipe atualiza imagens" on storage.objects
  for update to authenticated
  using (bucket_id in ('imoveis', 'blog', 'site') and public.is_staff());

create policy "equipe remove imagens" on storage.objects
  for delete to authenticated
  using (bucket_id in ('imoveis', 'blog', 'site') and public.is_staff());
