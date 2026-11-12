-- =====================================================================
-- Pasillo Público — Endurecimiento de seguridad (revisión 2026-11)
-- Ejecutar UNA vez en el SQL Editor de Supabase, sobre el esquema inicial.
-- Idempotente: se puede re-ejecutar sin error.
-- Los mismos cambios ya están incorporados en schema.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. profiles: columnas protegidas
--    La policy profiles_update deja al usuario editar su propia fila, pero
--    sin esto podía marcarse is_admin / is_approved desde el navegador.
--    SECURITY INVOKER a propósito: current_user es el rol real de la
--    petición (anon / authenticated / service_role / postgres).
-- ---------------------------------------------------------------------

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- service_role, postgres (SQL Editor) y admins pueden todo.
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;

  if new.id          is distinct from old.id
  or new.username    is distinct from old.username
  or new.is_admin    is distinct from old.is_admin
  or new.is_approved is distinct from old.is_approved
  or new.created_at  is distinct from old.created_at then
    raise exception 'No autorizado para modificar estos campos'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_columns on public.profiles;
create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- El perfil lo crea el trigger handle_new_user; un INSERT desde el cliente
-- permitiría crear una fila propia con is_admin = true.
drop policy if exists profiles_insert on public.profiles;

-- ---------------------------------------------------------------------
-- 2. Usernames reservados en el registro
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
  reserved       text[] := array[
    'admin', 'administrador', 'root', 'soporte', 'support', 'ayuda',
    'pasillo', 'pasillo-publico', 'pasillopublico', 'oficial', 'staff',
    'moderador', 'sistema', 'usuario'
  ];
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
  base_username := left(base_username, 30);

  -- 3) Garantizar unicidad y evitar nombres reservados.
  final_username := base_username;
  while final_username = any(reserved)
     or exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || '-' || suffix;
  end loop;

  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    final_username,
    left(nullif(new.raw_user_meta_data->>'full_name', ''), 100)
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Validación en la DB (las reglas zod solo corren en server actions;
--    el cliente puede escribir directo vía PostgREST).
--    NOT VALID: se aplican a filas nuevas/actualizadas sin fallar por datos
--    viejos. Luego de revisar los datos, correr los VALIDATE del final.
-- ---------------------------------------------------------------------

-- ¿La URL es un objeto público de `bucket` dentro de la carpeta `owner`?
create or replace function public.is_own_storage_url(url text, bucket text, owner uuid)
returns boolean
language sql
immutable
as $$
  select url ~ ('^https://[^/]+/storage/v1/object/public/' || bucket || '/' || owner::text || '/[^/]+$');
$$;

create or replace function public.are_own_storage_urls(urls text[], bucket text, owner uuid)
returns boolean
language sql
immutable
as $$
  select coalesce(bool_and(public.is_own_storage_url(u, bucket, owner)), true)
  from unnest(urls) as u;
$$;

alter table public.profiles drop constraint if exists profiles_website_url_check;
alter table public.profiles add constraint profiles_website_url_check
  check (website_url is null or (website_url ~* '^https?://[^\s"<>]+$' and length(website_url) <= 500)) not valid;

alter table public.profiles drop constraint if exists profiles_instagram_url_check;
alter table public.profiles add constraint profiles_instagram_url_check
  check (instagram_url is null or instagram_url ~ '^[A-Za-z0-9._]{1,30}$') not valid;

alter table public.profiles drop constraint if exists profiles_whatsapp_check;
alter table public.profiles add constraint profiles_whatsapp_check
  check (whatsapp is null or whatsapp ~ '^\d{7,15}$') not valid;

alter table public.profiles drop constraint if exists profiles_colors_check;
alter table public.profiles add constraint profiles_colors_check
  check (
    (color_primary   is null or color_primary   ~ '^#[0-9A-Fa-f]{6}$') and
    (color_secondary is null or color_secondary ~ '^#[0-9A-Fa-f]{6}$')
  ) not valid;

alter table public.profiles drop constraint if exists profiles_text_lengths_check;
alter table public.profiles add constraint profiles_text_lengths_check
  check (
    coalesce(length(full_name), 0) <= 100 and
    coalesce(length(bio), 0)       <= 500 and
    coalesce(length(city), 0)      <= 100
  ) not valid;

alter table public.profiles drop constraint if exists profiles_images_check;
alter table public.profiles add constraint profiles_images_check
  check (
    (avatar_url is null or public.is_own_storage_url(avatar_url, 'avatars', id)) and
    (banner_url is null or public.is_own_storage_url(banner_url, 'banners', id))
  ) not valid;

alter table public.artworks drop constraint if exists artworks_images_check;
alter table public.artworks add constraint artworks_images_check
  check (
    cardinality(images) between 1 and 5
    and public.are_own_storage_urls(images, 'artworks', artist_id)
  ) not valid;

alter table public.artworks drop constraint if exists artworks_fields_check;
alter table public.artworks add constraint artworks_fields_check
  check (
    length(title) between 1 and 200 and
    coalesce(length(description), 0) <= 1000 and
    coalesce(length(technique), 0)   <= 200 and
    coalesce(length(dimensions), 0)  <= 100 and
    (price is null or price >= 0) and
    (year is null or year between 1800 and 2100)
  ) not valid;

alter table public.services drop constraint if exists services_images_check;
alter table public.services add constraint services_images_check
  check (
    cardinality(images) <= 5
    and public.are_own_storage_urls(images, 'services', artist_id)
  ) not valid;

alter table public.services drop constraint if exists services_fields_check;
alter table public.services add constraint services_fields_check
  check (
    length(title) between 1 and 200 and
    coalesce(length(description), 0)   <= 1000 and
    coalesce(length(price_unit), 0)    <= 100 and
    coalesce(length(delivery_time), 0) <= 100 and
    (price is null or price >= 0)
  ) not valid;

-- La categoría debe existir en el lookup service_categories.
alter table public.services drop constraint if exists services_category_fkey;
alter table public.services add constraint services_category_fkey
  foreign key (category) references public.service_categories(name)
  on update cascade not valid;

-- ---------------------------------------------------------------------
-- 4. Storage: solo artistas aprobados suben a artworks / services.
--    avatars y banners siguen abiertos a cualquier usuario autenticado.
-- ---------------------------------------------------------------------

drop policy if exists storage_insert_own on storage.objects;
create policy storage_insert_own on storage.objects
  for insert to authenticated with check (
    (storage.foldername(name))[1] = auth.uid()::text
    and (
      bucket_id in ('avatars', 'banners')
      or (bucket_id in ('artworks', 'services')
          and public.is_approved_artist(auth.uid()))
    )
  );

drop policy if exists storage_update_own on storage.objects;
create policy storage_update_own on storage.objects
  for update to authenticated using (
    bucket_id in ('avatars', 'banners', 'artworks', 'services')
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    (storage.foldername(name))[1] = auth.uid()::text
    and (
      bucket_id in ('avatars', 'banners')
      or (bucket_id in ('artworks', 'services')
          and public.is_approved_artist(auth.uid()))
    )
  );

-- =====================================================================
-- Opcional, después de ejecutar lo anterior:
-- valida también las filas existentes. Si alguno falla, el mensaje dice
-- qué constraint; corrige esas filas y vuelve a correrlo.
--
-- alter table public.profiles validate constraint profiles_website_url_check;
-- alter table public.profiles validate constraint profiles_instagram_url_check;
-- alter table public.profiles validate constraint profiles_whatsapp_check;
-- alter table public.profiles validate constraint profiles_colors_check;
-- alter table public.profiles validate constraint profiles_text_lengths_check;
-- alter table public.profiles validate constraint profiles_images_check;
-- alter table public.artworks validate constraint artworks_images_check;
-- alter table public.artworks validate constraint artworks_fields_check;
-- alter table public.services validate constraint services_images_check;
-- alter table public.services validate constraint services_fields_check;
-- alter table public.services validate constraint services_category_fkey;
-- =====================================================================
