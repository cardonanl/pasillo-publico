import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mi perfil — Pasillo Público",
};

export default async function MiPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya protege esta ruta; guard de respaldo.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 font-display text-4xl font-black text-pp-ink">
        Mi perfil
      </h1>
      <p className="mb-8 text-pp-ink2">
        Tu rincón en el <span className="italic text-pp-blue">pasillo</span>.
      </p>

      <dl className="space-y-4 rounded-md border border-pp-ink p-6">
        <div>
          <dt className="text-sm text-pp-ink2">Usuario</dt>
          <dd className="font-medium text-pp-ink">
            {profile?.username ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-pp-ink2">Correo</dt>
          <dd className="font-medium text-pp-ink">{user.email}</dd>
        </div>
      </dl>

      <p className="mt-6 text-sm text-pp-ink2">
        La edición de perfil llega en el siguiente paso.
      </p>
    </main>
  );
}
