MANTIQUEIRA DRINKS - ETAPA 5
Upload de fotos dos drinks com Supabase Storage

1) No Supabase, abra Storage.
2) Clique em New Bucket.
3) Nome: drink-images
4) Marque Public bucket.
5) Se disponível, restrinja o bucket a imagens e limite a 5 MB.
6) Crie o bucket.

7) Abra SQL Editor e execute:
   supabase/02-storage-drink-images.sql

8) Substitua a pasta do projeto pela versão desta etapa.
9) Abra admin/index.html e faça login.
10) Cadastre um drink e selecione uma imagem.
11) Salve.

A imagem será enviada para Storage e o URL público será salvo em public.drinks.image_url.
O caminho interno será salvo em public.drinks.image_path, permitindo excluir a imagem antiga quando ela for substituída ou quando o drink for excluído.

IMPORTANTE:
- Use apenas a Publishable Key no front-end.
- Nunca coloque service_role/secret key no navegador.
- As políticas de Storage permitem upload/alteração/exclusão somente para usuários autenticados.
