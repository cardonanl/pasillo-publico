import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ArtworkForm } from "@/components/artwork/artwork-form";

export const metadata: Metadata = {
  title: "Subir obra — Pasillo Público",
};

export default async function SubirObraPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_artist, is_approved")
    .eq("id", user.id)
    .single();

  // ── Acceso denegado: no es artista ──────────────────────────────────
  if (!profile?.is_artist) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="font-display text-2xl font-black text-pp-ink">
          Primero regístrate como artista
        </p>
        <p className="mt-3 text-sm text-pp-ink2">
          Activa la opción <em>&ldquo;Soy artista o creador/a&rdquo;</em> en tu perfil.
          Un administrador revisará y aprobará tu cuenta.
        </p>
        <Link
          href="/mi-perfil/editar"
          className="mt-6 inline-flex items-center rounded-full border border-pp-ink bg-pp-yellow px-5 py-2.5 text-sm font-medium text-pp-ink shadow-[3px_3px_0_#0A0A0A] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#0A0A0A]"
        >
          Ir a editar perfil
        </Link>
      </main>
    );
  }

  // ── Acceso denegado: pendiente de aprobación ─────────────────────────
  if (!profile.is_approved) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="font-display text-2xl font-black text-pp-ink">
          Tu perfil está siendo revisado
        </p>
        <p className="mt-3 text-sm text-pp-ink2">
          Pronto un administrador aprobará tu cuenta y podrás publicar obras y
          servicios en el pasillo.
        </p>
        <Link
          href="/mi-perfil"
          className="mt-6 inline-flex items-center rounded-full border border-pp-ink bg-white px-5 py-2.5 text-sm font-medium text-pp-ink transition-colors hover:bg-pp-bg2"
        >
          Volver a mi perfil
        </Link>
      </main>
    );
  }

  // ── Artista aprobado: mostrar formulario ─────────────────────────────
  const { data: categories } = await supabase
    .from("artwork_categories")
    .select("id, name")
    .order("id");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 font-display text-4xl font-black text-pp-ink">
        Subir obra
      </h1>
      <p className="mb-8 text-sm text-pp-ink2">
        Tu obra quedará visible en tu{" "}
        <span className="italic text-pp-blue">pasillo</span> al publicarla.
      </p>

      <ArtworkForm
        profileId={profile.id}
        categories={categories ?? []}
      />
    </main>
  );
}
