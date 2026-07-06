import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ArtworkCard } from "@/components/artwork/artwork-card";
import { DeleteArtworkButton } from "@/components/artwork/delete-artwork-button";
import { ServiceCard } from "@/components/service/service-card";
import { DeleteServiceButton } from "@/components/service/delete-service-button";

export const metadata: Metadata = {
  title: "Mi perfil — Pasillo Público",
};

const pillBase =
  "inline-flex items-center rounded-full border border-pp-ink px-4 py-2 text-sm font-medium transition-transform";

export default async function MiPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) redirect("/login");

  const [{ data: artworks }, { data: services }] = await Promise.all([
    supabase
      .from("artworks")
      .select("id, title, technique, price, status, images")
      .eq("artist_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("services")
      .select("id, title, category, pricing_type, price, price_unit")
      .eq("artist_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const initials = (
    profile.full_name?.[0] ?? profile.username[0] ?? "?"
  ).toUpperCase();

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
        {/* ── Avatar + acciones ── */}
        <div className="flex items-end justify-between pb-4 pt-0">
          <div className="relative -mt-12">
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

          <div className="flex flex-wrap items-center gap-2 pt-4">
            <Link
              href="/mi-perfil/editar"
              className={`${pillBase} bg-pp-yellow shadow-[3px_3px_0_#0A0A0A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#0A0A0A]`}
            >
              ✎ Editar perfil
            </Link>
            {profile.is_artist && profile.is_approved && (
              <>
                <Link
                  href={`/artista/${profile.username}`}
                  className={`${pillBase} bg-white hover:bg-pp-bg2`}
                >
                  Ver galería ↗
                </Link>
                <Link
                  href="/subir-obra"
                  className={`${pillBase} bg-white hover:bg-pp-bg2`}
                >
                  + Obra
                </Link>
                <Link
                  href="/publicar-servicio"
                  className={`${pillBase} bg-white hover:bg-pp-bg2`}
                >
                  + Servicio
                </Link>
              </>
            )}
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

        {/* ── Badges de artista ── */}
        {profile.is_artist && (
          <div className="mt-3">
            {profile.is_approved ? (
              <span
                className="inline-block -rotate-1 rounded-full border border-pp-ink bg-pp-blue px-3 py-0.5 text-xs font-bold text-white"
                aria-label="Artista aprobado"
              >
                Artista ✦
              </span>
            ) : (
              <div className="rounded-md border border-dashed border-pp-ink bg-pp-yellow/20 px-4 py-3">
                <p className="text-sm font-medium text-pp-ink">
                  Tu perfil está pendiente de aprobación.
                </p>
                <p className="mt-0.5 text-xs text-pp-ink2">
                  Pronto podrás publicar obras y servicios en el pasillo.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Bio ── */}
        {profile.bio && (
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-pp-ink">
            {profile.bio}
          </p>
        )}

        {/* ── Links ── */}
        {(profile.instagram_url || profile.website_url || profile.whatsapp) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.whatsapp && (
              <a
                href={`https://wa.me/${profile.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${pillBase} bg-white hover:bg-pp-bg2`}
              >
                WhatsApp
              </a>
            )}
            {profile.instagram_url && (
              <a
                href={`https://instagram.com/${profile.instagram_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${pillBase} bg-white hover:bg-pp-bg2`}
              >
                @{profile.instagram_url}
              </a>
            )}
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${pillBase} bg-white hover:bg-pp-bg2`}
              >
                Sitio web
              </a>
            )}
          </div>
        )}

      </div>

      {/* ── Obras ─────────────────────────────────────────────────── */}
      {profile.is_artist && (
        <>
          <section className="border-t border-pp-ink py-12">
            <div className="mx-auto max-w-3xl px-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="font-display text-2xl font-black text-pp-ink">
                  Mis obras{" "}
                  <span className="text-base font-normal text-pp-ink2">
                    ({artworks?.length ?? 0})
                  </span>
                </h2>
                {profile.is_approved && (
                  <Link
                    href="/subir-obra"
                    className="inline-flex items-center rounded-full border border-pp-ink bg-pp-yellow px-4 py-1.5 text-sm font-medium text-pp-ink shadow-[2px_2px_0_#0A0A0A] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#0A0A0A]"
                  >
                    + Subir obra
                  </Link>
                )}
              </div>

              {!artworks || artworks.length === 0 ? (
                <div className="rounded-md border border-dashed border-pp-border py-14 text-center">
                  <p className="text-sm text-pp-ink2">
                    {profile.is_approved
                      ? "Aún no has subido obras."
                      : "Podrás subir obras cuando tu perfil sea aprobado."}
                  </p>
                  {profile.is_approved && (
                    <Link
                      href="/subir-obra"
                      className="mt-4 inline-flex items-center rounded-full border border-pp-ink bg-pp-yellow px-5 py-2 text-sm font-medium text-pp-ink shadow-[3px_3px_0_#0A0A0A]"
                    >
                      Subir primera obra
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {artworks.map((artwork) => (
                    <div key={artwork.id}>
                      <ArtworkCard
                        id={artwork.id}
                        title={artwork.title}
                        technique={artwork.technique}
                        price={artwork.price}
                        status={
                          artwork.status as
                            | "available"
                            | "sold"
                            | "not_for_sale"
                        }
                        images={artwork.images ?? []}
                      />
                      <DeleteArtworkButton
                        artworkId={artwork.id}
                        artworkTitle={artwork.title}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── Servicios ────────────────────────────────────────── */}
          <section className="border-t border-pp-ink bg-pp-blue-lt py-12">
            <div className="mx-auto max-w-3xl px-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="font-display text-2xl font-black text-pp-ink">
                  Mis servicios{" "}
                  <span className="text-base font-normal text-pp-ink2">
                    ({services?.length ?? 0})
                  </span>
                </h2>
                {profile.is_approved && (
                  <Link
                    href="/publicar-servicio"
                    className="inline-flex items-center rounded-full border border-pp-ink bg-pp-yellow px-4 py-1.5 text-sm font-medium text-pp-ink shadow-[2px_2px_0_#0A0A0A] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#0A0A0A]"
                  >
                    + Publicar servicio
                  </Link>
                )}
              </div>

              {!services || services.length === 0 ? (
                <div className="rounded-md border border-dashed border-pp-blue py-14 text-center">
                  <p className="text-sm text-pp-ink2">
                    {profile.is_approved
                      ? "Aún no has publicado servicios."
                      : "Podrás publicar servicios cuando tu perfil sea aprobado."}
                  </p>
                  {profile.is_approved && (
                    <Link
                      href="/publicar-servicio"
                      className="mt-4 inline-flex items-center rounded-full border border-pp-ink bg-pp-yellow px-5 py-2 text-sm font-medium text-pp-ink shadow-[3px_3px_0_#0A0A0A]"
                    >
                      Publicar primer servicio
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {services.map((service) => (
                    <div key={service.id}>
                      <ServiceCard
                        id={service.id}
                        title={service.title}
                        category={service.category}
                        pricing_type={
                          service.pricing_type as
                            | "fixed"
                            | "from"
                            | "negotiable"
                        }
                        price={service.price}
                        price_unit={service.price_unit}
                      />
                      <DeleteServiceButton
                        serviceId={service.id}
                        serviceTitle={service.title}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
