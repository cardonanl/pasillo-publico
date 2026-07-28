import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Manifiesto — Pasillo Público",
  description:
    "Por qué existe Pasillo Público y qué creemos sobre el arte colombiano.",
};

export default function ManifiestoPage() {
  return (
    <main className="min-h-screen bg-pp-bg">
      {/* ── Logo ── */}
      <header className="border-b border-pp-ink px-6 py-5">
        <Link
          href="/"
          className="font-display text-xl font-black text-pp-ink"
        >
          Pasillo{" "}
          <span className="font-normal italic text-pp-blue">Público</span>
        </Link>
      </header>

      {/* ── Contenido ── */}
      <article className="mx-auto max-w-2xl px-6 py-20">

        {/* Estrella de apertura */}
        <p className="mb-8 text-center font-display text-5xl text-pp-yellow [text-shadow:3px_3px_0_#0A0A0A]">
          ✦
        </p>

        {/* Título */}
        <h1 className="font-display text-5xl font-black leading-none text-pp-ink sm:text-6xl">
          El{" "}
          <em className="italic text-pp-blue">manifiesto</em>
          <br />
          del pasillo.
        </h1>

        {/* ── Cuerpo del manifiesto — placeholder ── */}
        {/* Reemplazar este bloque cuando el usuario envíe el texto final */}
        <div className="mt-12 space-y-8 text-base leading-relaxed text-pp-ink sm:text-lg">

          <blockquote className="border-l-2 border-pp-yellow pl-6 font-display text-2xl font-bold italic leading-snug text-pp-ink sm:text-3xl">
            "No hace falta una galería para que tu obra viva — ni una agencia
            para que tu talento trabaje."
          </blockquote>

          <p className="text-pp-ink2">
            [Párrafo 1 — introducción al pasillo y su razón de ser. Reemplazar
            con el texto final del manifiesto.]
          </p>

          <p className="text-pp-ink2">
            [Párrafo 2 — sobre el arte colombiano y su alcance. Reemplazar con
            el texto final del manifiesto.]
          </p>

          <blockquote className="border-l-2 border-pp-yellow pl-6 font-display text-xl font-bold italic leading-snug text-pp-ink sm:text-2xl">
            "Cita secundaria del manifiesto — reemplazar."
          </blockquote>

          <p className="text-pp-ink2">
            [Párrafo 3 — sobre la comunidad creativa de Cali y el Valle del
            Cauca. Reemplazar con el texto final del manifiesto.]
          </p>

          <p className="text-pp-ink2">
            [Párrafo 4 — cierre y llamado a la acción. Reemplazar con el texto
            final del manifiesto.]
          </p>
        </div>

        {/* Símbolo de cierre */}
        <p className="mt-16 text-center text-4xl opacity-30" aria-hidden="true">
          𓁹
        </p>

        <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-pp-ink2">
          Cali primero. Colombia después.
        </p>

        {/* ── CTAs ── */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-5">
          <Link
            href="/explorar"
            className="rounded-full border border-pp-ink bg-pp-yellow px-8 py-3.5 text-base font-medium text-pp-ink shadow-[4px_4px_0_#0A0A0A] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_#0A0A0A]"
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
      </article>
    </main>
  );
}
