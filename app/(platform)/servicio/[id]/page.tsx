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

type Service = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  pricing_type: "fixed" | "from" | "negotiable";
  price: number | null;
  price_unit: string | null;
  delivery_time: string | null;
  images: string[];
  artist_id: string;
  artist: Artist | null;
};

// ── Fetch con caché ───────────────────────────────────────────────────────
const getService = cache(async (id: string): Promise<Service | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select(
      `id, title, description, category, pricing_type, price, price_unit, delivery_time, images, artist_id,
       artist:profiles!artist_id(id, username, full_name, city, avatar_url, whatsapp, instagram_url, website_url)`
    )
    .eq("id", id)
    .eq("is_active", true)
    .single();
  return (data as Service | null) ?? null;
});

// ── Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const service = await getService(params.id);
  if (!service)
    return { title: "Servicio no encontrado — Pasillo Público" };

  const artist = service.artist;
  return {
    title: `${service.title} — Pasillo Público`,
    description:
      service.description ??
      `Servicio de ${artist?.full_name ?? artist?.username ?? "un artista"} en Pasillo Público`,
    openGraph: {
      title: service.title,
      description: service.description ?? undefined,
      images: service.images[0] ? [service.images[0]] : undefined,
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

function formatServicePrice(
  pricingType: "fixed" | "from" | "negotiable",
  price: number | null,
  priceUnit: string | null
): string | null {
  if (pricingType === "negotiable") return "A convenir";
  if (price === null) return null;
  const formatted = formatCOP(price);
  const withUnit = priceUnit ? `${formatted} / ${priceUnit}` : formatted;
  return pricingType === "from" ? `Desde ${withUnit}` : withUnit;
}

// ── Página ────────────────────────────────────────────────────────────────
export default async function ServicioPage({
  params,
}: {
  params: { id: string };
}) {
  const service = await getService(params.id);
  if (!service || !service.artist) notFound();

  const { artist } = service;
  const priceDisplay = formatServicePrice(
    service.pricing_type,
    service.price,
    service.price_unit
  );

  const contactMessage = `Hola, vi tu servicio "${service.title}" en Pasillo Público y me interesa.`;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-xs text-pp-ink2">
        <Link href="/servicios" className="hover:text-pp-ink">
          Servicios
        </Link>
        {" / "}
        <Link
          href={`/artista/${artist.username}`}
          className="hover:text-pp-ink"
        >
          {artist.full_name ?? artist.username}
        </Link>
        {" / "}
        <span className="text-pp-ink">{service.title}</span>
      </nav>

      {/* Layout principal */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ── Portafolio / galería (2/3) ── */}
        <div className="lg:col-span-2">
          {service.images.length > 0 ? (
            <ImageGallery images={service.images} title={service.title} />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-pp-ink bg-pp-bg2 text-sm text-pp-ink2">
              Sin imágenes de portafolio
            </div>
          )}
        </div>

        {/* ── Ficha + artista (1/3) ── */}
        <div className="space-y-6">
          {/* Título + categoría */}
          <div>
            <span className="inline-block rounded-full border border-pp-blue bg-pp-blue-lt px-2.5 py-0.5 text-[11px] font-medium text-pp-blue">
              {service.category}
            </span>
            <h1 className="mt-2 font-display text-3xl font-black leading-tight text-pp-ink">
              {service.title}
            </h1>
          </div>

          {/* Precio */}
          {priceDisplay && (
            <p className="font-display text-2xl font-black text-pp-ink">
              {priceDisplay}
            </p>
          )}

          {/* Descripción y ficha */}
          <div className="space-y-3 border-t border-pp-border pt-4">
            {service.description && (
              <p className="text-sm leading-relaxed text-pp-ink">
                {service.description}
              </p>
            )}
            {service.delivery_time && (
              <dl>
                <div className="flex gap-2 text-sm">
                  <dt className="w-24 flex-shrink-0 text-pp-ink2">
                    Entrega
                  </dt>
                  <dd className="text-pp-ink">{service.delivery_time}</dd>
                </div>
              </dl>
            )}
          </div>

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
