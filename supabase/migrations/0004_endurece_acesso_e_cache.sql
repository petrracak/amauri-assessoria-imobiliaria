-- Endurece o acesso ao banco e ao Storage, e corrige o cache das fotos.

-- 1. Storage ------------------------------------------------------------
-- Bucket público serve o arquivo pelo endereço direto, sem precisar de
-- política de leitura. A política de SELECT para anon só servia para uma
-- coisa: permitir LISTAR os arquivos — e a lista do bucket de avatares
-- mostrava o ID de cada pessoa da equipe (o nome das pastas).
drop policy if exists "avatares visiveis" on storage.objects;
drop policy if exists "imagens publicas" on storage.objects;

-- A equipe continua lendo: o Storage consulta o objeto antes de apagar ou
-- substituir, e essas operações passam pela política de SELECT.
create policy "equipe le arquivos" on storage.objects
  for select to authenticated
  using (bucket_id in ('imoveis', 'blog', 'site', 'avatares'));

-- 2. Permissões de tabela -----------------------------------------------
-- O Supabase entrega ALL para anon e authenticated e deixa a RLS segurar.
-- Funciona, mas é uma única barreira. Aqui o visitante fica só com o que o
-- site público usa: ler o catálogo e enviar um lead. TRUNCATE, por exemplo,
-- nem passa por RLS.
revoke all on all tables in schema public from anon;
revoke truncate, trigger, references on all tables in schema public from authenticated;

grant select on
  public.features,
  public.posts,
  public.properties,
  public.property_features,
  public.property_images,
  public.site_settings
to anon;

grant insert on public.leads to anon;

alter default privileges in schema public revoke all on tables from anon;

-- 3. Funções de gatilho -------------------------------------------------
-- Só o banco as dispara; ninguém precisa poder chamá-las.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protege_privilegios() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- 4. Freio no formulário de leads ---------------------------------------
-- O visitante só pode inserir, então a checagem precisa de SECURITY
-- DEFINER para enxergar os leads anteriores.
create or replace function public.limita_leads()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- O mesmo número de novo em poucos minutos é duplo toque ou robô.
  if exists (
    select 1 from public.leads
    where whatsapp = new.whatsapp
      and created_at > now() - interval '10 minutes'
  ) then
    raise exception 'lead_repetido';
  end if;

  -- Teto geral: um site imobiliário local não recebe 20 cadastros por minuto.
  if (
    select count(*) from public.leads
    where created_at > now() - interval '1 minute'
  ) >= 20 then
    raise exception 'lead_excesso';
  end if;

  return new;
end;
$$;

revoke execute on function public.limita_leads() from public, anon, authenticated;

drop trigger if exists leads_limita on public.leads;
create trigger leads_limita
  before insert on public.leads
  for each row execute function public.limita_leads();

-- 5. Cache das imagens --------------------------------------------------
-- Os arquivos importados foram gravados sem cache-control e saíam como
-- "private, no-cache": o celular rebaixava cada foto a cada visita e nenhum
-- CDN guardava. Os nomes não se repetem (referência + carimbo de tempo), então
-- um ano é seguro. Uploads novos já pedem o mesmo no código.
update storage.objects
set metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{cacheControl}', '"max-age=31536000"')
where bucket_id in ('imoveis', 'blog', 'site', 'avatares');
