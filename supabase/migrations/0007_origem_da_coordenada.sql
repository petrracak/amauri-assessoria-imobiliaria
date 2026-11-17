-- =====================================================================
-- De onde veio o pino.
--
-- 'link'     — coordenada tirada do link do Google Maps. É o lugar.
-- 'endereco' — coordenada tirada do endereço escrito, pelo OpenStreetMap.
--              Cai num ponto da rua certa, não no número: o OSM não tem
--              os números de Santarém. Serve para ver a carteira
--              distribuída no mapa, não para confiar como destino.
--
-- A coluna existe para três coisas: desenhar o pino aproximado diferente,
-- impedir que uma busca por endereço sobrescreva uma coordenada exata, e
-- deixar claro no cadastro o que é cada um.
--
-- Note que ela nasce fechada para a chave pública: a migração 0006 trocou
-- a permissão de tabela por permissão por coluna, e coluna nova não entra
-- naquela lista. É exatamente o efeito que se queria lá.
-- =====================================================================

alter table public.properties
  add column if not exists coordenada_origem text;

alter table public.properties
  drop constraint if exists properties_coordenada_origem;
alter table public.properties
  add constraint properties_coordenada_origem
  check (coordenada_origem is null or coordenada_origem in ('link', 'endereco'));

-- Quem já tem coordenada hoje só pode ter vindo do link: a busca por
-- endereço não existia antes desta migração.
update public.properties
set coordenada_origem = 'link'
where latitude is not null and coordenada_origem is null;
