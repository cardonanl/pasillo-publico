import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin — Pasillo Público",
};

// ── Helper para extraer search param ─────────────────────────────────────
function sp(val: unknown): string | undefined {
  return typeof val === "string" && val.trim() !== "" ? val : undefined;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filtro = sp(searchParams.filtro) ?? "all";

  // ── Artistas ──
  let artistQuery = supabase
    .from("profiles")
    .select(
      "id, username, full_name, city, avatar_url, is_approved, created_at"
    )
    .eq("is_artist", true)
    .order("is_approved", { ascending: true })
    .order("created_at", { ascending: false });

  if (filtro === "pending") artistQuery = artistQuery.eq("is_approved", false);
  if (filtro === "approved") artistQuery = artistQuery.eq("is_approved", true);

  const { data: artists } = await artistQuery;

  // ── Conteos de obras y servicios ──
  const ids = artists?.map((a) => a.id) ?? [];

  const [{ data: artworkRows }, { data: serviceRows }] = await Promise.all([
    ids.length > 0
      ? supabase
          .from("artworks")
          .select("artist_id")
          .in("artist_id", ids)
      : Promise.resolve({ data: [] }),
    ids.length > 0
      ? supabase
          .from("services")
          .select("artist_id")
          .in("artist_id", ids)
      : Promise.resolve({ data: [] }),
  ]);

  const artworkCount = new Map<string, number>();
  const serviceCount = new Map<string, number>();

  for (const row of artworkRows ?? []) {
    artworkCount.set(row.artist_id, (artworkCount.get(row.artist_id) ?? 0) + 1);
  }
  for (const row of serviceRows ?? []) {
    serviceCount.set(
      row.artist_id,
      (serviceCount.get(row.artist_id) ?? 0) + 1
    );
  }

  const pending = artists?.filter((a) => !a.is_approved).length ?? 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Cabecera */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-black text-pp-ink">
            Panel de admin
          </h1>
          {pending > 0 && (
            <p className="mt-1 text-sm text-pp-ink2">
              {pending} {pending === 1 ? "artista pendiente" : "artistas pendientes"} de aprobación.
            </p>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-2">
        {[
          { value: "all", label: "Todos" },
          { value: "pending", label: "Pendientes" },
          { value: "approved", label: "Aprobados" },
        ].map(({ value, label }) => (
          <Link
            key={value}
            href={value === "all" ? "/admin" : `/admin?filtro=${value}`}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors ${
              filtro === value
                ? "border-pp-ink bg-pp-ink text-white"
                : "border-pp-ink bg-white text-pp-ink hover:bg-pp-bg2"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Tabla */}
      {!artists || artists.length === 0 ? (
        <p className="py-12 text-center text-sm text-pp-ink2">
          No hay artistas con este filtro.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-pp-ink">
          <table className="w-full text-sm">
            <thead className="border-b border-pp-ink bg-pp-bg2">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-pp-ink">
                  Artista
                </th>
                <th className="px-4 py-3 text-left font-medium text-pp-ink">
                  Ciudad
                </th>
                <th className="px-4 py-3 text-left font-medium text-pp-ink">
                  Registro
                </th>
                <th className="px-4 py-3 text-left font-medium text-pp-ink">
                  Estado
                </th>
                <th className="px-4 py-3 text-center font-medium text-pp-ink">
                  Obras
                </th>
                <th className="px-4 py-3 text-center font-medium text-pp-ink">
                  Servicios
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-pp-border">
              {artists.map((artist) => {
                const initials = (
                  artist.full_name?.[0] ?? artist.username[0] ?? "?"
                ).toUpperCase();
                const date = new Date(artist.created_at).toLocaleDateString(
                  "es-CO",
                  { day: "2-digit", month: "2-digit", year: "numeric" }
                );

                return (
                  <tr key={artist.id} className="bg-white hover:bg-pp-bg2">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-pp-border bg-pp-bg2">
                          {artist.avatar_url ? (
                            <Image
                              src={artist.avatar_url}
                              alt={artist.username}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-pp-ink">
                              {initials}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-pp-ink">
                            {artist.full_name ?? artist.username}
                          </p>
                          <p className="text-xs text-pp-ink2">
                            @{artist.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-pp-ink2">
                      {artist.city ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-pp-ink2">{date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                          artist.is_approved
                            ? "border-pp-blue bg-pp-blue-lt text-pp-blue"
                            : "border-pp-ink bg-pp-yellow text-pp-ink"
                        }`}
                      >
                        {artist.is_approved ? "Aprobado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-pp-ink">
                      {artworkCount.get(artist.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center text-pp-ink">
                      {serviceCount.get(artist.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/artista/${artist.id}`}
                        className="text-xs font-medium text-pp-blue hover:underline"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export const dynamic = "force-dynamic";
