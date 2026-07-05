-- =====================================================================
-- Pasillo Público — Esquema inicial (Paso 2)
-- Tablas, lookups, trigger de creación de perfil, RLS y Storage.
-- Idempotente: se puede re-ejecutar sin error en el SQL Editor de Supabase.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique not null,
  full_name       text,
  bio             text,
  city            text,
  avatar_url      text,
  banner_url      text,
  color_primary   text,
  color_secondary text,
  instagram_url   text,
  website_url     text,
  whatsapp        text,
  is_artist       boolean not null default false,
  is_approved     boolean not null default false,
  is_admin        boolean not null default false,
  created_at      timestamptz not null default now()
);

create table if not exists public.artwork_categories (
  id   serial primary key,
  name text unique not null
);

create table if not exists public.service_categories (
  id   serial primary key,
  name text unique not null
);

create table if not exists public.artworks (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  technique   text,
  dimensions  text,
  year        int,
  price       numeric(12,2),
  status      text not null default 'available'
                check (status in ('available', 'sold', 'not_for_sale')),
  images      text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.services (
  id            uuid primary key default gen_random_uuid(),
  artist_id     uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  description   text,
  category      text not null,
  pricing_type  text not null default 'fixed'
                  check (pricing_type in ('fixed', 'from', 'negotiable')),
  price         numeric(12,2),
  price_unit    text,
  delivery_time text,
  images        text[] not null default '{}',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.artwork_category_map (
  artwork_id  uuid not null references public.artworks(id) on delete cascade,
  category_id int  not null references public.artwork_categories(id),
  primary key (artwork_id, category_id)
);

-- Índices para los filtros de exploración
create index if not exists artworks_artist_id_idx on public.artworks(artist_id);
create index if not exists artworks_status_idx     on public.artworks(status);
create index if not exists services_artist_id_idx  on public.services(artist_id);
create index if not exists services_category_idx   on public.services(category);
create index if not exists services_is_active_idx  on public.services(is_active);

-- ---------------------------------------------------------------------
-- 2. Seed de categorías (lookups)
-- ---------------------------------------------------------------------

insert into public.artwork_categories (name) values
  ('Pintura'), ('Dibujo'), ('Fotografía'), ('Escultura'),
  ('Arte digital'), ('Grabado'), ('Ilustración'), ('Otro')
on conflict (name) do nothing;

insert into public.service_categories (name) values
  ('Muralismo'), ('Retrato por comisión'), ('Pintura por comisión'),
  ('Escritura y guiones'), ('Ilustración'), ('Diseño gráfico'),
  ('Fotografía por encargo'), ('Tatuaje'), ('UI/UX'), ('Web design'),
  ('Front end'), ('NFTs y crypto art'), ('Visuales para música'),
  ('Curaduría'), ('Valorizaciones'), ('Otro')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- 3. Funciones helper (SECURITY DEFINER para evitar recursión de RLS)
--    Una policy sobre `profiles` que consulte `profiles` recursaría;
--    estas funciones leen la tabla saltándose RLS de forma controlada.
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Artista aprobado = perfil existente con is_approved = true.
create or replace function public.is_approved_artist(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_approved from public.profiles where id = uid),
    false
  );
$$;

-- ---------------------------------------------------------------------
-- 4. Trigger: crear perfil al registrarse en auth.users
--    El username inicial se toma del metadata del registro
--    (raw_user_meta_data->>'username') o se deriva del email,
--    se sanea a URL-safe y se garantiza único con sufijo numérico.
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username  text;
  final_username text;
  suffix         int := 0;
begin
  -- 1) Origen: username pedido en el registro, o parte local del email.
  base_username := lower(coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    split_part(new.email, '@', 1)
  ));

  -- 2) Sanear a URL-safe: solo [a-z0-9] y guiones, sin guiones a los extremos.
  base_username := regexp_replace(base_username, '[^a-z0-9]+', '-', 'g');
  base_username := trim(both '-' from base_username);
  if base_username is null or base_username = '' then
    base_username := 'usuario';
  end if;

  -- 3) Garantizar unicidad (username es UNIQUE NOT NULL).
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || '-' || suffix;
  end loop;

  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    final_username,
    nullif(new.raw_user_meta_data->>'full_name', '')
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 5. updated_at automático en artworks y services
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists artworks_set_updated_at on public.artworks;
create trigger artworks_set_updated_at
  before update on public.artworks
  for each row execute function public.set_updated_at();

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 6. Row Level Security
-- ---------------------------------------------------------------------

alter table public.profiles             enable row level security;
alter table public.artworks             enable row level security;
alter table public.services             enable row level security;
alter table public.artwork_categories   enable row level security;
alter table public.service_categories   enable row level security;
alter table public.artwork_category_map enable row level security;

-- ----- profiles -----
-- Lectura: perfiles aprobados (público), el propio, o admin.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    is_approved
    or auth.uid() = id
    or public.is_admin()
  );

-- Inserción: solo el propio usuario (el trigger ya lo crea con SECURITY DEFINER,
-- esta policy cubre inserciones manuales desde el cliente).
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (auth.uid() = id);

-- Actualización: el propio usuario o admin.
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = id or public.is_admin())
            with check (auth.uid() = id or public.is_admin());

-- Borrado: solo admin.
drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete using (public.is_admin());

-- ----- artworks -----
-- Lectura pública si el artista está aprobado; dueño y admin siempre.
drop policy if exists artworks_select on public.artworks;
create policy artworks_select on public.artworks
  for select using (
    public.is_approved_artist(artist_id)
    or auth.uid() = artist_id
    or public.is_admin()
  );

drop policy if exists artworks_insert on public.artworks;
create policy artworks_insert on public.artworks
  for insert with check (auth.uid() = artist_id);

drop policy if exists artworks_update on public.artworks;
create policy artworks_update on public.artworks
  for update using (auth.uid() = artist_id or public.is_admin())
            with check (auth.uid() = artist_id or public.is_admin());

drop policy if exists artworks_delete on public.artworks;
create policy artworks_delete on public.artworks
  for delete using (auth.uid() = artist_id or public.is_admin());

-- ----- services -----
-- DOBLE CONDICIÓN para lectura pública: is_active = true Y artista aprobado.
-- (fácil de olvidar). Dueño y admin ven los suyos aunque estén inactivos.
drop policy if exists services_select on public.services;
create policy services_select on public.services
  for select using (
    (is_active = true and public.is_approved_artist(artist_id))
    or auth.uid() = artist_id
    or public.is_admin()
  );

drop policy if exists services_insert on public.services;
create policy services_insert on public.services
  for insert with check (auth.uid() = artist_id);

drop policy if exists services_update on public.services;
create policy services_update on public.services
  for update using (auth.uid() = artist_id or public.is_admin())
            with check (auth.uid() = artist_id or public.is_admin());

drop policy if exists services_delete on public.services;
create policy services_delete on public.services
  for delete using (auth.uid() = artist_id or public.is_admin());

-- ----- artwork_category_map -----
-- Lectura pública si la obra es visible; escritura del dueño de la obra o admin.
drop policy if exists acm_select on public.artwork_category_map;
create policy acm_select on public.artwork_category_map
  for select using (
    exists (
      select 1 from public.artworks a
      where a.id = artwork_id
        and (public.is_approved_artist(a.artist_id)
             or auth.uid() = a.artist_id
             or public.is_admin())
    )
  );

drop policy if exists acm_write on public.artwork_category_map;
create policy acm_write on public.artwork_category_map
  for all using (
    exists (
      select 1 from public.artworks a
      where a.id = artwork_id
        and (auth.uid() = a.artist_id or public.is_admin())
    )
  ) with check (
    exists (
      select 1 from public.artworks a
      where a.id = artwork_id
        and (auth.uid() = a.artist_id or public.is_admin())
    )
  );

-- ----- categorías (lookups) -----
-- Lectura pública; escritura solo admin.
drop policy if exists artwork_categories_select on public.artwork_categories;
create policy artwork_categories_select on public.artwork_categories
  for select using (true);
drop policy if exists artwork_categories_write on public.artwork_categories;
create policy artwork_categories_write on public.artwork_categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists service_categories_select on public.service_categories;
create policy service_categories_select on public.service_categories
  for select using (true);
drop policy if exists service_categories_write on public.service_categories;
create policy service_categories_write on public.service_categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 7. Storage buckets + políticas
--    Convención de rutas: cada archivo se sube bajo una carpeta con el
--    id del usuario -> '{auth.uid}/archivo.ext'. Las policies de escritura
--    exigen que la primera carpeta de la ruta sea el uid del usuario.
--    (El código de subida debe seguir esta convención.)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('avatars',  'avatars',  true, 2097152),   -- 2 MB
  ('banners',  'banners',  true, 5242880),   -- 5 MB
  ('artworks', 'artworks', true, 10485760),  -- 10 MB
  ('services', 'services', true, 10485760)   -- 10 MB
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

-- Lectura pública de los 4 buckets.
drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select using (
    bucket_id in ('avatars', 'banners', 'artworks', 'services')
  );

-- Subida: usuario autenticado, solo dentro de su propia carpeta {uid}/...
drop policy if exists storage_insert_own on storage.objects;
create policy storage_insert_own on storage.objects
  for insert to authenticated with check (
    bucket_id in ('avatars', 'banners', 'artworks', 'services')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Actualizar / borrar: solo el dueño dentro de su carpeta.
drop policy if exists storage_update_own on storage.objects;
create policy storage_update_own on storage.objects
  for update to authenticated using (
    bucket_id in ('avatars', 'banners', 'artworks', 'services')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists storage_delete_own on storage.objects;
create policy storage_delete_own on storage.objects
  for delete to authenticated using (
    bucket_id in ('avatars', 'banners', 'artworks', 'services')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================================
-- Fin del esquema inicial.
-- =====================================================================
