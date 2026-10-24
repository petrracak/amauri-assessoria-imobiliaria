-- =====================================================================
-- Correções de segurança + login por nome
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ESCALADA DE PRIVILÉGIO (crítico)
--
-- A política "edita proprio perfil" permite UPDATE na própria linha, e o
-- RLS do Postgres não restringe colunas. Na prática, um corretor podia
-- rodar `update profiles set role='admin' where id = auth.uid()` e virar
-- administrador — ganhando configurações, pixels e exclusão de imóveis.
--
-- RLS não resolve isso sozinho; um gatilho sim.
-- ---------------------------------------------------------------------
create or replace function public.protege_privilegios()
  returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Sem usuário autenticado é operação de servidor (service_role ou
  -- manutenção direta no banco), que já passou por outra porta.
  if auth.uid() is null then
    return new;
  end if;

  if (new.role is distinct from old.role or new.ativo is distinct from old.ativo)
     and not public.is_admin() then
    raise exception 'Apenas administradores alteram papel ou situação de acesso';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protege_privilegios on public.profiles;
create trigger profiles_protege_privilegios
  before update on public.profiles
  for each row execute function public.protege_privilegios();

-- ---------------------------------------------------------------------
-- 2. PAPEL VINDO DO CADASTRO (latente)
--
-- handle_new_user confiava em raw_user_meta_data->>'role'. O cadastro
-- público está desligado hoje, mas se um dia for ligado, qualquer pessoa
-- se cadastraria já como admin. O papel passa a ser sempre o mínimo;
-- promover é ato explícito de um administrador.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    'corretor'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. CADASTRO DE LEAD SEM LIMITE (abuso)
--
-- O check era `true`: qualquer visitante podia gravar qualquer coluna,
-- inclusive marcar o próprio lead como convertido ou colar texto imenso.
-- O formulário manda pouca coisa; a política passa a exigir isso.
-- ---------------------------------------------------------------------
drop policy if exists "visitante cadastra lead" on public.leads;
create policy "visitante cadastra lead" on public.leads
  for insert to anon, authenticated
  with check (
    status = 'novo'
    and consentimento is true
    and anotacoes is null
    and length(nome) between 2 and 120
    and length(whatsapp) between 10 and 15
    and (mensagem is null or length(mensagem) <= 2000)
    and (origem is null or length(origem) <= 40)
  );

-- ---------------------------------------------------------------------
-- 4. VAZAMENTO DE RASCUNHOS (menor)
--
-- property_features era visível para todos, revelando o id de imóveis
-- ainda não publicados. Passa a seguir a mesma regra das fotos.
-- ---------------------------------------------------------------------
drop policy if exists "vinculos visiveis" on public.property_features;
create policy "vinculos visiveis" on public.property_features
  for select to anon, authenticated
  using (
    public.is_staff() or exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'publicado'
    )
  );

-- ---------------------------------------------------------------------
-- 5. LOGIN POR NOME
--
-- O Supabase Auth exige e-mail. Para quem entra por nome, o e-mail é
-- derivado do apelido e nunca recebe mensagem — por isso a recuperação
-- dessas contas é feita pelo administrador, no painel.
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists usuario text;

create unique index if not exists profiles_usuario_idx
  on public.profiles (lower(usuario)) where usuario is not null;

comment on column public.profiles.usuario is
  'Apelido de acesso (maria.souza). Nulo quando a pessoa entra pelo e-mail real.';
