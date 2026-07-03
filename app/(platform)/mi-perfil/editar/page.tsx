import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/artist/profile-form";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "Editar perfil — Pasillo Público",
};

export default async function EditarPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) redirect("/login");

  const profile = data as Profile;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 font-display text-4xl font-black text-pp-ink">
        Editar perfil
      </h1>
      <p className="mb-8 text-sm text-pp-ink2">
        Los cambios serán visibles en tu{" "}
        <span className="italic text-pp-blue">pasillo</span> al guardar.
      </p>

      <ProfileForm profile={profile} />
    </main>
  );
}
