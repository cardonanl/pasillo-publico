import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ArtworkCard } from "@/components/artwork/artwork-card";
import { ServiceCard } from "@/components/service/service-card";
import { AdminActions } from "@/components/admin/admin-actions";

export const metadata: Metadata = {
  title: "Detalle de artista — Admin",
};

export default async function AdminArtistaPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const artistId = params.id;

  // ── Perfil del artista (admin ve todos, aprobados o no) ──
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, bio, city, avatar_url, banner_url, instagram_url, website_url, whatsapp, is_artist, is_approved, created_at"
    )
    .eq("id", artistId)
    .single();

  if (!profile) notFound();

  // ── Obras y servicios (sin filtro de estado: admin ve todo) ──
  const [{ data: artworks }, { data: services }] = await Promise.all([
    supabase
      .from("artworks")
      .select("id, title, technique, price, status, images")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false }),
    supabase
      .from("services")
      .select("id, title, category, pricing_type, price, price_unit")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false }),
  ]);

  const initials = (
    profile.full_name?.[0] ?? profile.username[0] ?? "?"
  ).toUpperCase();

  const createdAt = new Date(profile.created_at).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-xs text-pp-ink2">
        <Link href="/admin" className="hover:text-pp-ink">
          Admin
        </Link>
        {" / "}
        <span className="text-pp-ink">
          {profile.full_name ?? profile.username}
        </span>
      </nav>

      {/* ── Cabecera del perfil ── */}
      <div className="mb-8 overflow-hidden rounded-md border border-pp-ink">
        {/* Banner */}
        <div className="relative h-32 w-full bg-pp-bg2">
          {profile.banner_url && (
            <Image
              src={profile.banner_url}
              alt="Banner"
              fill
              className="object-cover"
            />
          )}
        </div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-10 mb-3 inline-block">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-pp-bg2 shadow-[2px_2px_0_#0A0A0A]">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-pp-ink">
                  {initials}
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-black text-pp-ink">
                {profile.full_name ?? profile.username}
              </h1>
              <p className="text-sm text-pp-ink2">
                @{profile.username}
                {profile.city && (
                  <span className="before:mx-2 before:content-['·']">
                    {profile.city}
                  </span>
                )}
                <span className="before:mx-2 before:content-['·']">
                  Se unió el {createdAt}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span
                  className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                    profile.is_approved
                      ? "border-pp-blue bg-pp-blue-lt text-pp-blue"
                      : "border-pp-ink bg-pp-yellow text-pp-ink"
                  }`}
                >
                  {profile.is_approved ? "Aprobado" : "Pendiente"}
                </span>
                {profile.is_artist && (
                  <span className="inline-block rounded-full border border-pp-border bg-pp-bg2 px-2.5 py-0.5 text-[11px] font-bold text-pp-ink2">
                    Artista
                  </span>
                )}
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-2 text-xs">
              {profile.whatsapp && (
                <a
                  href={`https://wa.me/${profile.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-pp-border bg-pp-bg2 px-3 py-1 text-pp-ink hover:bg-pp-border"
                >
                  WhatsApp
                </a>
              )}
              {profile.instagram_url && (
                <a
                  href={`https://instagram.com/${profile.instagram_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-pp-border bg-pp-bg2 px-3 py-1 text-pp-ink hover:bg-pp-border"
                >
                  @{profile.instagram_url}
                </a>
              )}
              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-pp-border bg-pp-bg2 px-3 py-1 text-pp-ink hover:bg-pp-border"
                >
                  Sitio web
                </a>
              )}
              {profile.is_approved && (
                <Link
                  href={`/artista/${profile.username}`}
                  target="_blank"
                  className="rounded-full border border-pp-blue bg-pp-blue-lt px-3 py-1 text-pp-blue hover:bg-pp-blue/10"
                >
                  Ver galería pública ↗
                </Link>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-pp-ink2">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* ── Acciones admin ── */}
      <div className="mb-10">
        <AdminActions
          artistId={profile.id}
          username={profile.username}
          isApproved={profile.is_approved}
        />
      </div>

      {/* ── Obras ── */}
      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl font-black text-pp-ink">
          Obras{" "}
          <span className="text-base font-normal text-pp-ink2">
            ({artworks?.length ?? 0})
          </span>
        </h2>
        {artworks && artworks.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {artworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                id={artwork.id}
                title={artwork.title}
                technique={artwork.technique}
                price={artwork.price}
                status={
                  artwork.status as "available" | "sold" | "not_for_sale"
                }
                images={artwork.images ?? []}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-pp-ink2">
            Este artista no ha subido obras aún.
          </p>
        )}
      </section>

      {/* ── Servicios ── */}
      <section>
        <h2 className="mb-6 font-display text-xl font-black text-pp-ink">
          Servicios{" "}
          <span className="text-base font-normal text-pp-ink2">
            ({services?.length ?? 0})
          </span>
        </h2>
        {services && services.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                title={service.title}
                category={service.category}
                pricing_type={
                  service.pricing_type as "fixed" | "from" | "negotiable"
                }
                price={service.price}
                price_unit={service.price_unit}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-pp-ink2">
            Este artista no ha publicado servicios aún.
          </p>
        )}
      </section>
    </main>
  );
}

export const dynamic = "force-dynamic";
