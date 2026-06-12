# CLAUDE.md — Pasillo Público

Este archivo define las convenciones, arquitectura y restricciones del proyecto. Léelo **completo** antes de escribir cualquier código o crear cualquier archivo.

---

## Proyecto

**Pasillo Público** es un marketplace de arte y servicios creativos colombiano, con sede narrativa en Cali y el Valle del Cauca. Tiene dos vitrinas:

1. **Obras** — piezas terminadas en venta (pinturas, dibujos, fotografía, escultura, arte digital)
2. **Servicios** — talento creativo por encargo (murales, retratos por comisión, guiones para redes, ilustración, diseño)

**Lema:** *Arte al alcance de todos y todas.*

Sin pasarela de pagos en V1. El contacto comprador→artista es vía WhatsApp o correo.

---

## Stack

| Herramienta | Versión / Notas |
|---|---|
| Next.js | 14, App Router (`app/`) |
| TypeScript | Estricto — nunca usar `any` |
| Supabase | Auth + PostgreSQL + Storage |
| Tailwind CSS | v3 con tema extendido (ver sección UI) |
| Shadcn/ui | Componentes base — no instalar otras librerías UI |
| react-hook-form + zod | Formularios y validación |
| Vercel | Deploy |

---

## Estructura de carpetas

```
/app
  /page.tsx                      ← Landing pública
  /(auth)
    /login/page.tsx
    /registro/page.tsx
  /(platform)
    /explorar/page.tsx            ← Grid de obras + filtros
    /servicios/page.tsx           ← Grid de servicios + filtros
    /obra/[id]/page.tsx           ← Vista individual de obra
    /servicio/[id]/page.tsx       ← Vista individual de servicio
    /artista/[slug]/page.tsx      ← Perfil público (obras + servicios)
    /mi-perfil/
      /page.tsx                   ← Vista del propio perfil
      /editar/page.tsx            ← Edición de perfil
    /subir-obra/page.tsx          ← Formulario nueva obra
    /publicar-servicio/page.tsx   ← Formulario nuevo servicio
    /admin/
      /page.tsx                   ← Lista de artistas pendientes
      /artista/[id]/page.tsx      ← Aprobar / rechazar artista
/components
  /ui/                            ← Componentes Shadcn (no editar)
  /shared/                        ← Nav, Footer, Marquee, etc.
  /artwork/                       ← ArtworkCard, ArtworkGrid, ArtworkForm...
  /service/                       ← ServiceCard, ServiceGrid, ServiceForm...
  /artist/                        ← ArtistCard, ArtistProfile, AvatarUpload...
/lib
  /supabase/
    /client.ts                    ← createBrowserClient()
    /server.ts                    ← createServerClient()
    /middleware.ts
  /utils.ts
/types
  /index.ts                       ← Todos los tipos del dominio
/public
  /fonts/
```

---

## Base de datos (Supabase / PostgreSQL)

### Tabla: `profiles`
Se crea automáticamente con un trigger al registrarse en `auth.users`.

```sql
id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
username        text UNIQUE NOT NULL
full_name       text
bio             text
city            text
avatar_url      text          -- Storage bucket: avatars
banner_url      text          -- Storage bucket: banners
color_primary   text          -- hex, ej: '#1AA6C9'
color_secondary text          -- hex
instagram_url   text
website_url     text
whatsapp        text          -- con código de país, ej: '573001234567'
is_artist       boolean DEFAULT false
is_approved     boolean DEFAULT false
is_admin        boolean DEFAULT false
created_at      timestamptz DEFAULT now()
```

### Tabla: `artworks`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
artist_id   uuid REFERENCES profiles(id) ON DELETE CASCADE
title       text NOT NULL
description text
technique   text          -- ej: 'Óleo sobre lienzo'
dimensions  text          -- ej: '40x60 cm'
year        int
price       numeric(12,2) -- en COP
status      text DEFAULT 'available'  -- available | sold | not_for_sale
images      text[]        -- Storage bucket: artworks (máx 5)
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```

### Tabla: `services`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
artist_id     uuid REFERENCES profiles(id) ON DELETE CASCADE
title         text NOT NULL              -- ej: 'Guiones para redes sociales'
description   text
category      text NOT NULL              -- ver service_categories
pricing_type  text DEFAULT 'fixed'       -- fixed | from | negotiable
price         numeric(12,2)              -- NULL si negotiable
price_unit    text                       -- ej: 'por guion', 'por m²', 'por obra'
delivery_time text                       -- ej: '3 semanas', 'a convenir'
images        text[]                     -- Storage bucket: services (portafolio, máx 5)
is_active     boolean DEFAULT true
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()
```

### Tabla: `artwork_categories` (lookup)
```sql
id    serial PRIMARY KEY
name  text UNIQUE NOT NULL
-- Iniciales: 'Pintura', 'Dibujo', 'Fotografía', 'Escultura', 'Arte digital', 'Grabado', 'Ilustración', 'Otro'
```

### Tabla: `service_categories` (lookup)
```sql
id    serial PRIMARY KEY
name  text UNIQUE NOT NULL
-- Iniciales: 'Muralismo', 'Retrato por comisión', 'Escritura y guiones', 'Ilustración', 'Diseño gráfico', 'Fotografía por encargo', 'Tatuaje', 'Otro'
```

### Tabla: `artwork_category_map`
```sql
artwork_id  uuid REFERENCES artworks(id) ON DELETE CASCADE
category_id int  REFERENCES artwork_categories(id)
PRIMARY KEY (artwork_id, category_id)
```

### Storage buckets
| Bucket | Acceso | Límite por archivo |
|---|---|---|
| `avatars` | público | 2 MB |
| `banners` | público | 5 MB |
| `artworks` | público | 10 MB |
| `services` | público | 10 MB |

### RLS (Row Level Security)
- `profiles`: lectura pública si `is_approved = true`; escritura solo del propio usuario; admin todo
- `artworks`: lectura pública si el artista está aprobado; escritura solo del `artist_id` dueño; admin todo
- `services`: lectura pública si `is_active = true` y el artista está aprobado; escritura solo del dueño; admin todo

---

## Tipos TypeScript (`/types/index.ts`)

```typescript
export type ArtworkStatus = 'available' | 'sold' | 'not_for_sale'
export type PricingType = 'fixed' | 'from' | 'negotiable'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  city: string | null
  avatar_url: string | null
  banner_url: string | null
  color_primary: string | null
  color_secondary: string | null
  instagram_url: string | null
  website_url: string | null
  whatsapp: string | null
  is_artist: boolean
  is_approved: boolean
  is_admin: boolean
  created_at: string
}

export interface Artwork {
  id: string
  artist_id: string
  title: string
  description: string | null
  technique: string | null
  dimensions: string | null
  year: number | null
  price: number | null
  status: ArtworkStatus
  images: string[]
  created_at: string
  updated_at: string
  artist?: Profile
  categories?: string[]
}

export interface Service {
  id: string
  artist_id: string
  title: string
  description: string | null
  category: string
  pricing_type: PricingType
  price: number | null
  price_unit: string | null
  delivery_time: string | null
  images: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  artist?: Profile
}
```

---

## Sistema de diseño (UI)

### Paleta de colores
```
--pp-bg:       #FFFFFF   ← fondo principal
--pp-bg2:      #F7F7F7   ← fondo secciones alternas
--pp-ink:      #0A0A0A   ← texto principal y bordes estructurales
--pp-ink2:     #777777   ← texto secundario / metadatos
--pp-border:   #E8E8E8   ← bordes suaves internos
--pp-yellow:   #FEC70B   ← acento primario — CTAs, stickers, highlights
--pp-blue:     #1AA6C9   ← acento secundario — itálicas, tags, links
--pp-blue-lt:  #EAF6FA   ← fondos azul claro (sección servicios, tags)
```

Extender `tailwind.config.ts` con estos valores bajo `theme.extend.colors.pp`.

### Tipografía
- **Display / títulos:** `Playfair Display` — pesos 400, 700, 900, con itálica. Los títulos mezclan intencionalmente pesos, tamaños e itálica azul en líneas distintas.
- **UI / cuerpo:** `Inter Tight` — pesos 300, 400, 500, 700

### Carácter visual — juguetón, leve surrealismo
Esta identidad es deliberada, no decoración opcional:
- **Rotaciones sutiles** (0.5°–8°) en cards, stickers y elementos flotantes — imperfección intencional
- **Botones pill** (border-radius 50px) con borde negro 1px; el CTA primario lleva **sombra dura** `3px 3px 0 #0A0A0A` (nunca sombras difusas)
- **Stickers/badges** rotados con borde negro y fondo amarillo o azul
- **Óvalo dibujado a mano** (SVG ellipse, stroke amarillo) alrededor de palabras clave en títulos
- **Símbolos recurrentes:** estrella `✦` (amarilla con contorno negro) y ojo `𓁹` como guiños surrealistas — usar con moderación, 1–3 por página
- **Servicios = tablón de anuncios:** cards con `border: 1px dashed` y un "pin" circular amarillo arriba; las obras llevan borde sólido (marco de cuadro)
- **Marquee** negro con mezcla de sans uppercase + itálicas serif en amarillo
- **Subrayados ondulados** (`text-decoration: underline wavy`) en links secundarios
- Bordes estructurales entre secciones: `1px solid #0A0A0A` (negro, no gris)

### Reglas
- Fondo blanco por defecto; `#F7F7F7` o `#EAF6FA` solo para contraste de secciones
- El carácter viene de composición y tipografía, **no** de agregar colores
- Las obras son siempre protagonistas — la decoración nunca compite con las imágenes
- Espaciado base: múltiplos de 8px
- Lema: **"Arte al alcance de todos y todas."** — "todos y todas" siempre en el mismo tamaño, peso y estilo
- Rutas en español: `/explorar`, `/servicios`, `/artista/[slug]`, `/subir-obra`, `/publicar-servicio`, `/registro`
- Copy y errores en español colombiano

---

## Convenciones de código

- TypeScript estricto. Nunca `any`.
- Server Components por defecto. `'use client'` solo con interactividad real.
- Manejo de errores explícito en toda llamada a Supabase — verificar `error` siempre.
- Cliente Supabase de servidor en Server Components y Route Handlers; cliente browser solo en Client Components.
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.
- Slugs de artistas: derivados del `username`, URL-safe, minúsculas.
- Imágenes siempre con `next/image`.

---

## Lo que NO debes hacer

- No instalar librerías de UI adicionales (ya hay Shadcn/ui)
- No usar `npx shadcn@latest add` — el CLI actual genera componentes para Tailwind v4 (Base UI, utilidades v4) incompatibles con nuestro stack v3. Los componentes shadcn nuevos se copian manualmente de la documentación v3 y se adaptan.
- No crear tablas nuevas en DB sin actualizar este archivo
- No implementar login con redes sociales (fuera de scope V1)
- No implementar pasarela de pagos (es Fase 2)
- No usar colores fuera del sistema de diseño
- No usar `any` en TypeScript
- No usar sombras difusas (`box-shadow` blur) — solo sombras duras
- No diferenciar tipográficamente "todos" de "todas" en el lema

---

## Variables de entorno requeridas

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       ← solo en server, nunca al cliente
```

---

## Estado del proyecto

**Fase activa:** Setup inicial — nada implementado aún.

**Orden de construcción:**
1. Setup Next.js + Supabase + Tailwind + fuentes
2. Tablas, RLS y Storage buckets en Supabase
3. Auth: registro y login
4. Perfil de artista (creación + edición)
5. Subida de obras
6. Publicación de servicios
7. Vista pública del artista (dos vitrinas: obras + servicios)
8. Exploración de obras + filtros
9. Exploración de servicios + filtros
10. Vistas individuales (obra y servicio) + botón de contacto
11. Panel de admin
12. Landing page pública
