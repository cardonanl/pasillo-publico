import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { ServiceCard } from "@/components/service/service-card";
import { ServiceFilters } from "@/components/service/service-filters";

export const metadata: Metadata = {
  title: "Servicios creativos — Pasillo Público",
};

// ── Helpers ───────────────────────────────────────────────────────────────
function sp(val: unknown): string | undefined {
  return typeof val === "string" && val.trim() !== "" ? val : undefined;
}

// ── Consulta con filtros ──────────────────────────────────────────────────
async function fetchServices(params: {
  [key: string]: string | string[] | undefined;
}) {
  const supabase = await createClient();

  const categoria = sp(params.categoria);
  const pricingType = sp(params.pricing_type);
  const ciudad = sp(params.ciudad);
  const orden = sp(params.orden) ?? "reciente";

  // ── Artistas por ciudad (si aplica) ──
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

  // ── Query principal ──
  let q = supabase
    .from("services")
    .select("id, title, category, pricing_type, price, price_unit")
    .eq("is_active", true);

  if (categoria) q = q.eq("category", categoria);
  if (pricingType) q = q.eq("pricing_type", pricingType);
  if (artistIds !== null && artistIds.length > 0) {
    q = q.in("artist_id", artistIds);
  }

  if (orden === "precio_asc") {
    q = q.order("price", { ascending: true, nullsFirst: false });
  } else {
    q = q.order("created_at", { ascending: false });
  }

  const { data } = await q;
  return data ?? [];
}

// ── Página ────────────────────────────────────────────────────────────────
export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  const [services, { data: categories }] = await Promise.all([
    fetchServices(searchParams),
    supabase.from("service_categories").select("id, name").order("id"),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* ── Título ── */}
      <div className="mb-8">
        <h1 className="font-display text-5xl font-black leading-tight text-pp-ink">
          Talento{" "}
          <em className="italic text-pp-blue">por encargo</em>
        </h1>
        <p className="mt-2 text-sm text-pp-ink2">
          Servicios creativos de artistas colombianos disponibles para ti.
        </p>
      </div>

      {/* ── Filtros ── */}
      <div className="mb-8">
        <Suspense
          fallback={
            <div className="h-24 animate-pulse rounded-md bg-pp-bg2" />
          }
        >
          <ServiceFilters categories={categories ?? []} />
        </Suspense>
      </div>

      {/* ── Grid de servicios ── */}
      {services.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-2xl font-black text-pp-ink">
            No encontramos servicios con esos filtros.
          </p>
          <p className="mt-3 text-sm text-pp-ink2">
            Prueba con otros filtros u ofrece tus servicios en el pasillo.
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
          <p className="mb-6 text-xs text-pp-ink2">
            {services.length}{" "}
            {services.length === 1 ? "servicio" : "servicios"}
          </p>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
        </>
      )}
    </main>
  );
}

export const dynamic = "force-dynamic";
