import Image from "next/image";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { ArtworkCard } from "@/components/artwork/artwork-card";
import { ServiceCard } from "@/components/service/service-card";
import { Footer } from "@/components/shared/footer";

// ── Contenido del marquee (duplicado para loop seamless) ─────────────────
const MARQUEE_ITEMS = [
  { text: "PINTURAS", serif: false },
  { text: "murales por encargo", serif: true },
  { text: "FOTOGRAFÍA", serif: false },
  { text: "guiones para redes", serif: true },
  { text: "ESCULTURA", serif: false },
  { text: "retratos por comisión", serif: true },
  { text: "ARTE DIGITAL", serif: false },
  { text: "diseño gráfico", serif: true },
  { text: "ILUSTRACIÓN", serif: false },
  { text: "visuales para música", serif: true },
  { text: "TATUAJE", serif: false },
  { text: "web design", serif: true },
];

const CARD_ROTATIONS = [
  "rotate-[0.5deg]",
  "-rotate-[0.5deg]",
  "rotate-[0.8deg]",
  "-rotate-[0.8deg]",
];

export default async function LandingPage() {
  const supabase = await createClient();

  const [{ data: artworks }, { data: services }] = await Promise.all([
    supabase
      .from("artworks")
      .select("id, title, technique, price, status, images")
      .neq("status", "not_for_sale")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("services")
      .select("id, title, category, pricing_type, price, price_unit")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. HERO
      ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-pp-ink">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-12 lg:gap-4">

          {/* ── Texto ── */}
          <div className="min-w-0 flex-1">
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.25em] text-pp-ink2">
              Cali · Valle del Cauca · Colombia
            </p>

            <h1 className="font-display leading-none">
              <span className="block text-6xl font-normal text-pp-ink sm:text-7xl lg:text-8xl">
                Arte al
              </span>
              <span className="block text-6xl font-black italic text-pp-blue sm:text-7xl lg:text-8xl">
                alcance
              </span>
              <span className="block text-6xl font-bold text-pp-ink sm:text-7xl lg:text-8xl">
                de todos y todas.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-pp-ink sm:text-lg">
              Un pasillo abierto donde cualquier artista puede exponer y
              cualquier persona puede llevarse una obra a casa.
            </p>

            <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.22em] text-pp-ink2">
              Pinturas · Murales · Guiones · Fotografía · Retratos · Diseño
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-5">
              <Link
                href="/explorar"
                className="rounded-full border border-pp-ink bg-pp-yellow px-7 py-3.5 text-base font-medium text-pp-ink shadow-[4px_4px_0_#0A0A0A] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_#0A0A0A]"
              >
                Entrar al pasillo
              </Link>
              <Link
                href="/registro"
                className="font-medium text-pp-blue underline decoration-wavy decoration-pp-blue underline-offset-4 hover:opacity-70"
              >
                Soy artista →
              </Link>
            </div>
          </div>

          {/* ── Composición decorativa — solo desktop ── */}
          <div
            className="relative hidden h-[420px] w-[340px] flex-shrink-0 lg:block"
            aria-hidden="true"
          >
            {/* Marco principal — 240×300 */}
            <div className="absolute right-0 top-0 h-[300px] w-[240px] rotate-[4deg] overflow-hidden rounded-md border-2 border-pp-ink bg-pp-bg2 shadow-[6px_6px_0_#0A0A0A]">
              <Image
                src="/hero/obra-1.jpg"
                alt=""
                fill
                className="object-cover"
                sizes="240px"
              />
            </div>

            {/* Marco secundario — 180×220 solapado abajo-izquierda */}
            <div className="absolute bottom-0 left-0 h-[220px] w-[180px] -rotate-[6deg] overflow-hidden rounded-md border-2 border-pp-ink bg-pp-bg2 shadow-[5px_5px_0_#0A0A0A]">
              <Image
                src="/hero/obra-2.jpg"
                alt=""
                fill
                className="object-cover"
                sizes="180px"
              />
            </div>

            {/* Sticker — entre los dos marcos */}
            <div className="absolute bottom-[130px] right-[30px] rotate-[10deg]">
              <div className="rounded-full border-2 border-pp-ink bg-pp-yellow px-4 py-2 text-xs font-bold uppercase tracking-wide text-pp-ink shadow-[3px_3px_0_#0A0A0A]">
                ✦ Desde $40.000
              </div>
            </div>

            {/* Estrella — arriba izquierda */}
            <span className="absolute left-2 top-6 font-display text-4xl text-pp-yellow [text-shadow:3px_3px_0_#0A0A0A]">
              ✦
            </span>

            {/* Ojo — arriba derecha */}
            <span className="absolute right-0 top-2 text-3xl opacity-30">
              𓁹
            </span>

            {/* Estrella pequeña — zona central */}
            <span className="absolute bottom-[200px] left-[155px] font-display text-xl text-pp-yellow [text-shadow:2px_2px_0_#0A0A0A]">
              ✦
            </span>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. MARQUEE
      ───────────────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden border-b border-pp-ink bg-pp-ink py-4"
        aria-hidden="true"
      >
        <div className="flex animate-marquee whitespace-nowrap">
          {/* Set original + duplicado para loop seamless */}
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="mx-6 inline-flex items-center gap-6">
              {item.serif ? (
                <span className="font-display text-xl italic text-pp-yellow">
                  {item.text}
                </span>
              ) : (
                <span className="font-sans text-sm font-bold uppercase tracking-widest text-white">
                  {item.text}
                </span>
              )}
              <span className="text-pp-yellow">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. DOS PUERTAS
      ───────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 border-b border-pp-ink md:grid-cols-2">
        {/* Izquierda: Obras */}
        <div className="border-b border-pp-ink p-10 md:border-b-0 md:border-r md:p-14">
          <span className="inline-block rounded-full border border-pp-ink bg-pp-yellow px-3 py-0.5 text-xs font-bold text-pp-ink">
            Obras
          </span>
          <h2 className="mt-4 font-display text-3xl font-black leading-tight text-pp-ink sm:text-4xl">
            Piezas listas{" "}
            <em className="italic text-pp-blue">para irse.</em>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-pp-ink2">
            Pinturas, fotografías, esculturas y arte digital de artistas
            colombianos listos para vivir en tu espacio.
          </p>
          <Link
            href="/explorar"
            className="mt-6 inline-flex items-center font-medium text-pp-ink underline decoration-wavy decoration-pp-ink underline-offset-4 hover:text-pp-blue hover:decoration-pp-blue"
          >
            Explorar obras →
          </Link>
        </div>

        {/* Derecha: Servicios */}
        <div className="bg-pp-blue-lt p-10 md:p-14">
          <span className="inline-block rounded-full border border-pp-blue bg-white px-3 py-0.5 text-xs font-bold text-pp-blue">
            Servicios
          </span>
          <h2 className="mt-4 font-display text-3xl font-black leading-tight text-pp-ink sm:text-4xl">
            Talento{" "}
            <em className="italic text-pp-blue">disponible.</em>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-pp-ink2">
            Murales, retratos, guiones, diseño y más — por encargo, a tu
            medida, directo del artista.
          </p>
          <Link
            href="/servicios"
            className="mt-6 inline-flex items-center font-medium text-pp-blue underline decoration-wavy decoration-pp-blue underline-offset-4 hover:text-pp-ink hover:decoration-pp-ink"
          >
            Ver servicios →
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. OBRAS RECIENTES
      ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-pp-ink py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-4xl font-black leading-tight text-pp-ink sm:text-5xl">
              Lo que llega al{" "}
              <em className="italic text-pp-blue">pasillo</em>
            </h2>
            <Link
              href="/explorar"
              className="inline-flex items-center rounded-full border border-pp-ink bg-white px-5 py-2 text-sm font-medium text-pp-ink hover:bg-pp-bg2"
            >
              Ver todo →
            </Link>
          </div>

          {artworks && artworks.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {artworks.map((artwork, i) => (
                <div
                  key={artwork.id}
                  className={CARD_ROTATIONS[i % CARD_ROTATIONS.length]}
                >
                  <ArtworkCard
                    id={artwork.id}
                    title={artwork.title}
                    technique={artwork.technique}
                    price={artwork.price}
                    status={
                      artwork.status as "available" | "sold" | "not_for_sale"
                    }
                    images={artwork.images ?? []}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-pp-border py-20 text-center">
              <p className="text-sm text-pp-ink2">
                Las obras llegarán pronto. ¿Eres artista?
              </p>
              <Link
                href="/registro"
                className="mt-4 inline-flex items-center rounded-full border border-pp-ink bg-pp-yellow px-5 py-2 text-sm font-medium text-pp-ink shadow-[3px_3px_0_#0A0A0A]"
              >
                Súbete al pasillo ✦
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. SERVICIOS DESTACADOS
      ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-pp-ink bg-pp-blue-lt py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-4xl font-black leading-tight text-pp-ink sm:text-5xl">
              Talento{" "}
              <em className="italic text-pp-blue">por encargo</em>
            </h2>
            <Link
              href="/servicios"
              className="inline-flex items-center rounded-full border border-pp-ink bg-white px-5 py-2 text-sm font-medium text-pp-ink hover:bg-pp-bg2"
            >
              Ver todos →
            </Link>
          </div>

          {services && services.length > 0 ? (
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
          ) : (
            <div className="rounded-md border border-dashed border-pp-blue py-20 text-center">
              <p className="text-sm text-pp-ink2">
                Los servicios llegarán pronto.
              </p>
              <Link
                href="/registro"
                className="mt-4 inline-flex items-center rounded-full border border-pp-ink bg-pp-yellow px-5 py-2 text-sm font-medium text-pp-ink shadow-[3px_3px_0_#0A0A0A]"
              >
                Ofrece tu talento ✦
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. MANIFIESTO
      ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-pp-ink py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          {/* Estrella superior */}
          <span className="font-display text-4xl text-pp-yellow [text-shadow:2px_2px_0_#0A0A0A]">
            ✦
          </span>

          {/* Cita con estrellas a los lados en desktop */}
          <div className="mt-6 flex items-start justify-center gap-4 lg:gap-8">
            <span
              className="hidden flex-shrink-0 font-display text-5xl text-pp-yellow lg:block [text-shadow:3px_3px_0_#0A0A0A]"
              aria-hidden="true"
            >
              ✦
            </span>

            <blockquote className="font-display text-2xl font-bold italic leading-snug text-pp-ink sm:text-3xl md:text-4xl">
              &ldquo;No hace falta una galería para que tu obra viva —
              ni una agencia para que tu talento{" "}
              <span
                className="not-italic"
                style={{
                  background:
                    "linear-gradient(transparent 55%, #FEC70B 55%)",
                }}
              >
                trabaje
              </span>
              .&rdquo;
            </blockquote>

            <span
              className="hidden flex-shrink-0 font-display text-5xl text-pp-yellow lg:block [text-shadow:3px_3px_0_#0A0A0A]"
              aria-hidden="true"
            >
              ✦
            </span>
          </div>

          {/* Ojo surrealista */}
          <p
            className="mt-8 text-4xl opacity-30"
            aria-hidden="true"
          >
            𓁹
          </p>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-pp-ink2">
            Cali primero. Colombia después.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FOOTER
      ───────────────────────────────────────────────────────────── */}
      <Footer />
    </>
  );
}

export const dynamic = "force-dynamic";
