MANTIQUEIRA DRINKS — SITE + ADMIN + SUPABASE

ETAPA 3 — BANCO ONLINE E LOGIN

O painel admin agora usa Supabase em vez de localStorage.

Estrutura:
- index.html = site público
- script.js / style.css = site
- admin/login.html = login do administrador
- admin/index.html = painel
- admin/admin.js = CRUD conectado ao Supabase
- admin/config.js = URL + Publishable Key públicas do Supabase

IMPORTANTE:
- A Publishable Key pode ficar no navegador.
- NUNCA coloque service_role ou qualquer Secret Key no front-end.
- O banco precisa estar com RLS/policies configurados pelo SQL da pasta supabase.

CONFIGURAÇÃO:
1. Execute o arquivo supabase/01-criar-banco-drinks.sql no SQL Editor do Supabase.
2. Em Authentication > Users, crie o usuário administrador com e-mail e senha.
3. Abra admin/login.html.
4. Entre com o usuário criado.
5. Cadastre, edite e exclua drinks.

Se o painel mostrar erro de permissão, revise as policies/RLS do SQL.

PRÓXIMA ETAPA:
- fazer o site público carregar os drinks reais do Supabase;
- depois trocar URL de imagem por upload no Supabase Storage.
