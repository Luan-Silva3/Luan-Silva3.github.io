-- ETAPA 5 - Storage das fotos dos drinks
-- Execute no SQL Editor do mesmo projeto Supabase.

-- Adiciona o caminho do arquivo à tabela de drinks.
alter table public.drinks
add column if not exists image_path text;

-- Permite que usuários autenticados façam upload somente no bucket drink-images.
create policy "Admins can upload drink images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'drink-images');

-- Permite que usuários autenticados excluam fotos do bucket.
create policy "Admins can delete drink images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'drink-images');

-- Permite atualizar/substituir objetos, caso isso seja necessário futuramente.
create policy "Admins can update drink images"
on storage.objects
for update
to authenticated
using (bucket_id = 'drink-images')
with check (bucket_id = 'drink-images');
