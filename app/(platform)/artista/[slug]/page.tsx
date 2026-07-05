import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ArtworkCard } from "@/components/artwork/artwork-card";
import { ServiceCard } from "@/components/service/service-card";

// ── Datos del artista (cacheados por slug para deduplicar entre
//    generateMetadata y el componente de página) ─────────────────────────
const getArtistProfile = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, bio, city, avatar_url, banner_url, instagram_url, website_url, whatsapp, is_approved, is_artist"
    )
    .eq("username", slug)
    .eq("is_artist", true)
    .eq("is_approved", true)
    .single();
  return data;
});

// ── Metadata dinámica ─────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const profile = await getArtistProfile(params.slug);
  if (!profile) return { title: "Artista no encontrado — Pasillo Público" };
  const name = profile.full_name ?? profile.username;
  return { title: `${name} — Pasillo Público` };
}

// ── Página ────────────────────────────────────────────────────────────────
export default async function ArtistaPage({
  params,
}: {
  params: { slug: string };
}) {
  const profile = await getArtistProfile(params.slug);
  if (!profile) notFound();

  const supabase = await createClient();

  const [{ data: artworks }, { data: services }] = await Promise.all([
    supabase
      .from("artworks")
      .select("id, title, technique, price, status, images")
      .eq("artist_id", profile.id)
      .neq("status", "not_for_sale")
      .order("created_at", { ascending: false }),
    supabase
      .from("services")
      .select("id, title, category, pricing_type, price, price_unit")
      .eq("artist_id", profile.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const initials = (
    profile.full_name?.[0] ?? profile.username[0] ?? "?"
  ).toUpperCase();

  const hasArtworks = (artworks?.length ?? 0) > 0;
  const hasServices = (services?.length ?? 0) > 0;

  return (
    <main>
      {/* ── Banner ── */}
      <div className="relative h-48 w-full border-b border-pp-ink bg-pp-bg2">
        {profile.banner_url && (
          <Image
            src={profile.banner_url}
            alt="Banner"
            fill
            className="object-cover"
            priority
          />
        )}
      </div>

      <div className="mx-auto max-w-3xl px-6">
        {/* ── Avatar ── */}
        <div className="pb-4 pt-0">
          <div className="relative -mt-12 inline-block">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-pp-bg2 shadow-[3px_3px_0_#0A0A0A]">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-pp-ink">
                  {initials}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Nombre + metadatos ── */}
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-black text-pp-ink">
            {profile.full_name ?? profile.username}
          </h1>
          <p className="text-sm text-pp-ink2">
            @{profile.username}
            {profile.city && (
              <span className="before:mx-2 before:content-['·']">
                {profile.city}
              </span>
            )}
          </p>
        </div>

        {/* ── Badge artista ── */}
        <div className="mt-3">
          <span className="inline-block -rotate-1 rounded-full border border-pp-ink bg-pp-blue px-3 py-0.5 text-xs font-bold text-white">
            Artista ✦
          </span>
        </div>

        {/* ── Bio ── */}
        {profile.bio && (
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-pp-ink">
            {profile.bio}
          </p>
        )}

        {/* ── Links de contacto ── */}
        {(profile.whatsapp || profile.instagram_url || profile.website_url) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.whatsapp && (
              <a
                href={`https://wa.me/${profile.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-pp-ink bg-pp-yellow px-4 py-2 text-sm font-medium text-pp-ink shadow-[3px_3px_0_#0A0A0A] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#0A0A0A]"
              >
                WhatsApp
              </a>
            )}
            {profile.instagram_url && (
              <a
                href={`https://instagram.com/${profile.instagram_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-pp-ink bg-white px-4 py-2 text-sm font-medium text-pp-ink transition-colors hover:bg-pp-bg2"
              >
                @{profile.instagram_url}
              </a>
            )}
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-pp-ink bg-white px-4 py-2 text-sm font-medium text-pp-ink transition-colors hover:bg-pp-bg2"
              >
                Sitio web
              </a>
            )}
          </div>
        )}

        {/* ── Sin contenido ── */}
        {!hasArtworks && !hasServices && (
          <div className="my-16 text-center">
            <p className="text-sm text-pp-ink2">
              Este artista aún no ha publicado obras ni servicios.
            </p>
          </div>
        )}
      </div>

      {/* ── Vitrina: Obras ─────────────────────────────────────────────── */}
      {hasArtworks && (
        <section className="mt-14 border-t border-pp-ink">
          <div className="mx-auto max-w-3xl px-6 py-10">
            <h2 className="mb-6 font-display text-2xl font-black text-pp-ink">
              Obras
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {artworks!.map((artwork) => (
                <ArtworkCard
                  key={artwork.id}
                  id={artwork.id}
                  title={artwork.title}
                  technique={artwork.technique}
                  price={artwork.price}
                  status={artwork.status as "available" | "sold" | "not_for_sale"}
                  images={artwork.images ?? []}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Vitrina: Servicios ─────────────────────────────────────────── */}
      {hasServices && (
        <section className={`border-t border-pp-ink bg-pp-blue-lt`}>
          <div className="mx-auto max-w-3xl px-6 py-10">
            <h2 className="mb-8 font-display text-2xl font-black text-pp-ink">
              Servicios
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {services!.map((service) => (
                <ServiceCard
                  key={service.id}
                  id={service.id}
                  title={service.title}
                  category={service.category}
                  pricing_type={service.pricing_type as "fixed" | "from" | "negotiable"}
                  price={service.price}
                  price_unit={service.price_unit}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Pie: botón de contacto global ─────────────────────────────── */}
      {profile.whatsapp && (
        <div className="border-t border-pp-ink py-12 text-center">
          <p className="mb-4 font-display text-lg font-bold text-pp-ink">
            ¿Quieres trabajar con{" "}
            <span className="italic text-pp-blue">
              {profile.full_name ?? profile.username}
            </span>
            ?
          </p>
          <a
            href={`https://wa.me/${profile.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-pp-ink bg-pp-yellow px-6 py-3 text-sm font-medium text-pp-ink shadow-[3px_3px_0_#0A0A0A] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#0A0A0A]"
          >
            Contactar por WhatsApp
          </a>
        </div>
      )}

      {/* Pie sin WhatsApp pero con instagram/web */}
      {!profile.whatsapp &&
        (profile.instagram_url || profile.website_url) && (
          <div className="border-t border-pp-ink py-12 text-center">
            <p className="mb-4 font-display text-lg font-bold text-pp-ink">
              ¿Quieres trabajar con{" "}
              <span className="italic text-pp-blue">
                {profile.full_name ?? profile.username}
              </span>
              ?
            </p>
            <div className="flex justify-center gap-3">
              {profile.instagram_url && (
                <a
                  href={`https://instagram.com/${profile.instagram_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-pp-ink bg-white px-5 py-2.5 text-sm font-medium text-pp-ink transition-colors hover:bg-pp-bg2"
                >
                  Instagram
                </a>
              )}
              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-pp-ink bg-white px-5 py-2.5 text-sm font-medium text-pp-ink transition-colors hover:bg-pp-bg2"
                >
                  Sitio web
                </a>
              )}
            </div>
          </div>
        )}

      {/* Espacio final si no hay ningún link de contacto */}
      {!profile.whatsapp && !profile.instagram_url && !profile.website_url && (
        <div className="h-16" />
      )}
    </main>
  );
}

// Datos en tiempo real — sin caché estático en V1.
export const dynamic = "force-dynamic";
