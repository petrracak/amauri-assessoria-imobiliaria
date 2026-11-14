-- Localização do imóvel no Google Maps.
--
-- mapa_url:   o link que a equipe colou (ou o endereço do código "incorporar").
-- mapa_embed: o endereço do mapa embutido, montado no servidor a partir do
--             link. Link curto (maps.app.goo.gl) não pode ser embutido; o
--             servidor segue o redirecionamento e guarda o resultado aqui,
--             então a página pública não precisa resolver nada.
alter table public.properties
  add column if not exists mapa_url text,
  add column if not exists mapa_embed text;

alter table public.properties
  drop constraint if exists properties_mapa_tamanho;
alter table public.properties
  add constraint properties_mapa_tamanho
  check (length(mapa_url) <= 2000 and length(mapa_embed) <= 2000);
