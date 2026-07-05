import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { ArtworkCard } from "@/components/artwork/artwork-card";
import { ArtworkFilters } from "@/components/artwork/artwork-filters";

export const metadata: Metadata = {
  title: "Explorar obras — Pasillo Público",
};

// ── Helpers para extraer search params de forma segura ───────────────────
function sp(val: unknown): string | undefined {
  return typeof val === "string" && val.trim() !== "" ? val : undefined;
}
function spNum(val: unknown): number | null {
  const s = sp(val);
  if (!s) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// ── Consulta principal con filtros ───────────────────────────────────────
async function fetchArtworks(params: {
  [key: string]: string | string[] | undefined;
}) {
  const supabase = await createClient();

  const categoria = sp(params.categoria);
  const precioMin = spNum(params.precio_min);
  const precioMax = spNum(params.precio_max);
  const ciudad = sp(params.ciudad);
  const estado = sp(params.estado);
  const orden = sp(params.orden) ?? "reciente";

  // ── Paso 1: artistas por ciudad (si aplica) ──
  let artistIds: string[] | null = null;
  if (ciudad) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("is_approved", true)
      .ilike("city", `%${ciudad}%`);
    artistIds = data?.map((p) => p.id) ?? [];
    if (artistIds.length === 0) return [];
  }

  // ── Paso 2: artworks por categoría (si aplica) ──
  let catArtworkIds: string[] | null = null;
  if (categoria) {
    const catId = parseInt(categoria, 10);
    if (!isNaN(catId)) {
      const { data } = await supabase
        .from("artwork_category_map")
        .select("artwork_id")
        .eq("category_id", catId);
      catArtworkIds = data?.map((r) => r.artwork_id) ?? [];
      if (catArtworkIds.length === 0) return [];
    }
  }

  // ── Paso 3: query principal ──
  let q = supabase
    .from("artworks")
    .select("id, title, technique, price, status, images");

  // Estado
  if (estado === "available") q = q.eq("status", "available");
  else if (estado === "sold") q = q.eq("status", "sold");
  else q = q.neq("status", "not_for_sale");

  // Precio
  if (precioMin !== null) q = q.gte("price", precioMin);
  if (precioMax !== null) q = q.lte("price", precioMax);

  // Artistas (ciudad)
  if (artistIds !== null && artistIds.length > 0) {
    q = q.in("artist_id", artistIds);
  }

  // Obras (categoría)
  if (catArtworkIds !== null && catArtworkIds.length > 0) {
    q = q.in("id", catArtworkIds);
  }

  // Orden
  if (orden === "precio_asc") {
    q = q.order("price", { ascending: true, nullsFirst: false });
  } else if (orden === "precio_desc") {
    q = q.order("price", { ascending: false, nullsFirst: false });
  } else {
    q = q.order("created_at", { ascending: false });
  }

  const { data } = await q;
  return data ?? [];
}

// ── Página ────────────────────────────────────────────────────────────────
export default async function ExplorarPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  const [artworks, { data: categories }] = await Promise.all([
    fetchArtworks(searchParams),
    supabase.from("artwork_categories").select("id, name").order("id"),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* ── Título ── */}
      <div className="mb-8">
        <h1 className="font-display text-5xl font-black leading-tight text-pp-ink">
          Lo que llega al{" "}
          <em className="italic text-pp-blue">pasillo</em>
        </h1>
        <p className="mt-2 text-sm text-pp-ink2">
          Obras de artistas colombianos disponibles para ti.
        </p>
      </div>

      {/* ── Filtros (client component, requiere Suspense) ── */}
      <div className="mb-8">
        <Suspense
          fallback={
            <div className="h-28 animate-pulse rounded-md bg-pp-bg2" />
          }
        >
          <ArtworkFilters categories={categories ?? []} />
        </Suspense>
      </div>

      {/* ── Grid de obras ── */}
      {artworks.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-2xl font-black text-pp-ink">
            No encontramos obras con esos filtros.
          </p>
          <p className="mt-3 text-sm text-pp-ink2">
            Prueba con otros filtros o descubre todo el pasillo.
          </p>
          <Link
            href="/registro"
            className="mt-6 inline-flex items-center rounded-full border border-pp-ink bg-pp-yellow px-5 py-2.5 text-sm font-medium text-pp-ink shadow-[3px_3px_0_#0A0A0A] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#0A0A0A]"
          >
            Únete al pasillo ✦
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs text-pp-ink2">
            {artworks.length} {artworks.length === 1 ? "obra" : "obras"}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
        </>
      )}
    </main>
  );
}

export const dynamic = "force-dynamic";
