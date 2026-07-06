import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ImageGallery } from "@/components/shared/image-gallery";
import { ArtistContactCard } from "@/components/shared/artist-contact-card";

// ── Tipos ─────────────────────────────────────────────────────────────────
type Artist = {
  id: string;
  username: string;
  full_name: string | null;
  city: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  instagram_url: string | null;
  website_url: string | null;
};

type Artwork = {
  id: string;
  title: string;
  description: string | null;
  technique: string | null;
  dimensions: string | null;
  year: number | null;
  price: number | null;
  status: "available" | "sold" | "not_for_sale";
  images: string[];
  artist_id: string;
  artist: Artist | null;
};

// ── Fetch con caché (deduplicado entre generateMetadata y la página) ──────
const getArtwork = cache(async (id: string): Promise<Artwork | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("artworks")
    .select(
      `id, title, description, technique, dimensions, year, price, status, images, artist_id,
       artist:profiles!artist_id(id, username, full_name, city, avatar_url, whatsapp, instagram_url, website_url)`
    )
    .eq("id", id)
    .single();
  return (data as Artwork | null) ?? null;
});

// ── Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const artwork = await getArtwork(params.id);
  if (!artwork)
    return { title: "Obra no encontrada — Pasillo Público" };

  const artist = artwork.artist;
  return {
    title: `${artwork.title} — Pasillo Público`,
    description:
      artwork.description ??
      `Obra de ${artist?.full_name ?? artist?.username ?? "un artista"} en Pasillo Público`,
    openGraph: {
      title: artwork.title,
      description: artwork.description ?? undefined,
      images: artwork.images[0] ? [artwork.images[0]] : undefined,
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────
function formatCOP(price: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

const STATUS_LABELS: Record<string, string> = {
  available: "En venta",
  sold: "Vendida",
  not_for_sale: "No disponible",
};

// ── Página ────────────────────────────────────────────────────────────────
export default async function ObraPage({
  params,
}: {
  params: { id: string };
}) {
  const artwork = await getArtwork(params.id);
  if (!artwork || !artwork.artist) notFound();

  const { artist } = artwork;

  // Categorías de la obra
  const supabase = await createClient();
  const { data: catData } = await supabase
    .from("artwork_category_map")
    .select("artwork_categories(name)")
    .eq("artwork_id", artwork.id);

  const categories: string[] =
    catData
      ?.map((r) => {
        const cat = r.artwork_categories as unknown as
          | { name: string }
          | { name: string }[]
          | null;
        if (!cat) return null;
        return Array.isArray(cat) ? (cat[0]?.name ?? null) : cat.name;
      })
      .filter((n): n is string => Boolean(n)) ?? [];

  const contactMessage = `Hola, vi tu obra "${artwork.title}" en Pasillo Público y me interesa.`;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-xs text-pp-ink2">
        <Link href="/explorar" className="hover:text-pp-ink">
          Explorar
        </Link>
        {" / "}
        <Link
          href={`/artista/${artist.username}`}
          className="hover:text-pp-ink"
        >
          {artist.full_name ?? artist.username}
        </Link>
        {" / "}
        <span className="text-pp-ink">{artwork.title}</span>
      </nav>

      {/* Layout principal */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ── Galería (2/3) ── */}
        <div className="lg:col-span-2">
          <ImageGallery images={artwork.images} title={artwork.title} />
        </div>

        {/* ── Ficha + artista (1/3) ── */}
        <div className="space-y-6">
          {/* Título */}
          <div>
            <h1 className="font-display text-3xl font-black leading-tight text-pp-ink">
              {artwork.title}
            </h1>
            {categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-block rounded-full border border-pp-blue bg-pp-blue-lt px-2.5 py-0.5 text-[11px] font-medium text-pp-blue"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Precio y estado */}
          <div className="space-y-1.5">
            {artwork.status === "available" && artwork.price !== null && (
              <p className="font-display text-3xl font-black text-pp-ink">
                {formatCOP(artwork.price)}
              </p>
            )}
            <span
              className={`inline-block rounded-full border px-3 py-0.5 text-xs font-bold ${
                artwork.status === "available"
                  ? "border-pp-ink bg-pp-yellow text-pp-ink"
                  : artwork.status === "sold"
                    ? "border-pp-ink bg-pp-ink text-white"
                    : "border-pp-border bg-pp-bg2 text-pp-ink2"
              }`}
            >
              {STATUS_LABELS[artwork.status]}
            </span>
          </div>

          {/* Ficha técnica */}
          {(artwork.description ||
            artwork.technique ||
            artwork.dimensions ||
            artwork.year) && (
            <div className="space-y-3 border-t border-pp-border pt-4">
              {artwork.description && (
                <p className="text-sm leading-relaxed text-pp-ink">
                  {artwork.description}
                </p>
              )}
              <dl className="space-y-1.5 text-sm">
                {artwork.technique && (
                  <div className="flex gap-2">
                    <dt className="w-24 flex-shrink-0 text-pp-ink2">
                      Técnica
                    </dt>
                    <dd className="text-pp-ink">{artwork.technique}</dd>
                  </div>
                )}
                {artwork.dimensions && (
                  <div className="flex gap-2">
                    <dt className="w-24 flex-shrink-0 text-pp-ink2">
                      Dimensiones
                    </dt>
                    <dd className="text-pp-ink">{artwork.dimensions}</dd>
                  </div>
                )}
                {artwork.year && (
                  <div className="flex gap-2">
                    <dt className="w-24 flex-shrink-0 text-pp-ink2">Año</dt>
                    <dd className="text-pp-ink">{artwork.year}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Tarjeta del artista + contacto */}
          <div className="border-t border-pp-border pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-pp-ink2">
              Artista
            </p>
            <ArtistContactCard
              username={artist.username}
              full_name={artist.full_name}
              city={artist.city}
              avatar_url={artist.avatar_url}
              whatsapp={artist.whatsapp}
              instagram_url={artist.instagram_url}
              website_url={artist.website_url}
              contactMessage={contactMessage}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
