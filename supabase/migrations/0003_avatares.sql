-- =====================================================================
-- Foto de perfil da equipe
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Leitura pública: a foto aparece no painel e pode vir a aparecer no site.
create policy "avatares visiveis" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatares');

-- Cada pessoa escreve só na pasta com o próprio id. Sem isto, um corretor
-- poderia trocar a foto de qualquer outro.
create policy "avatar proprio: enviar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatares'
    and public.is_staff()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatar proprio: substituir" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatares'
    and public.is_staff()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatar proprio: remover" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatares'
    and public.is_staff()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
