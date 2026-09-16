-- MANTIQUEIRA DRINKS
-- Etapa 2: banco de dados + segurança do CRUD de drinks
--
-- Execute este arquivo no SQL Editor do Supabase.
-- Depois crie o usuário administrador em Authentication > Users.

create table if not exists public.drinks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  ingredients text,
  price numeric(10,2),
  image_url text,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Segurança: o site público poderá ler somente drinks disponíveis.
-- Somente usuários autenticados poderão cadastrar/editar/excluir.

alter table public.drinks enable row level security;

drop policy if exists "Public can view available drinks" on public.drinks;
create policy "Public can view available drinks"
on public.drinks
for select
to anon
using (available = true);

create policy "Authenticated admins can view all drinks"
on public.drinks
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert drinks" on public.drinks;
create policy "Authenticated users can insert drinks"
on public.drinks
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update drinks" on public.drinks;
create policy "Authenticated users can update drinks"
on public.drinks
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete drinks" on public.drinks;
create policy "Authenticated users can delete drinks"
on public.drinks
for delete
to authenticated
using (true);

-- Permissões da Data API.
revoke all on table public.drinks from anon, authenticated;
grant select on table public.drinks to anon;
grant select, insert, update, delete on table public.drinks to authenticated;

-- Atualiza automaticamente updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists drinks_set_updated_at on public.drinks;
create trigger drinks_set_updated_at
before update on public.drinks
for each row
execute function public.set_updated_at();

-- Índice útil para o site público.
create index if not exists drinks_available_idx
on public.drinks (available);

-- Dados de teste.
insert into public.drinks
  (name, category, description, ingredients, available)
values
  (
    'Mantiqueira Mule',
    'Autorais',
    'Vodka, limão, gengibre e espuma em uma combinação refrescante.',
    'Vodka, limão, xarope de gengibre e espuma',
    true
  ),
  (
    'Gin da Serra',
    'Autorais',
    'Gin, cítricos e notas aromáticas para um drink leve e elegante.',
    'Gin, limão, tônica e botânicos',
    true
  ),
  (
    'Negroni',
    'Clássicos',
    'Um clássico intenso e equilibrado para quem aprecia sabores marcantes.',
    'Gin, vermute rosso e bitter',
    true
  )
on conflict do nothing;
