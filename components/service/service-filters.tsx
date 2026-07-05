"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface Category {
  id: number;
  name: string;
}

const inputClass =
  "rounded-md border border-pp-ink bg-white px-3 py-1.5 text-sm placeholder:text-pp-ink2 focus:outline-none focus:ring-2 focus:ring-pp-ink";

const PRICING_LABELS: Record<string, string> = {
  fixed: "Precio fijo",
  from: "Desde",
  negotiable: "A convenir",
};

export function ServiceFilters({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentCat = searchParams.get("categoria") ?? "";
  const currentPricing = searchParams.get("pricing_type") ?? "";
  const currentOrden = searchParams.get("orden") ?? "reciente";

  const [ciudad, setCiudad] = useState(searchParams.get("ciudad") ?? "");

  function update(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function togglePill(key: string, value: string, current: string) {
    update(key, current === value ? null : value);
  }

  function applyCiudad() {
    const params = new URLSearchParams(searchParams.toString());
    if (ciudad.trim()) params.set("ciudad", ciudad.trim());
    else params.delete("ciudad");
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters =
    currentCat || currentPricing || searchParams.get("ciudad");

  return (
    <div className="space-y-4 rounded-md border border-pp-border bg-pp-bg2 p-4">
      {/* ── Categorías ── */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const active = currentCat === cat.name;
          return (
            <button
              key={cat.id}
              onClick={() => togglePill("categoria", cat.name, currentCat)}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors ${
                active
                  ? "border-pp-ink bg-pp-ink text-white"
                  : "border-pp-ink bg-white text-pp-ink hover:bg-pp-border"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* ── Tipo de precio ── */}
      <div className="flex flex-wrap gap-2">
        <span className="flex items-center text-xs font-medium text-pp-ink2">
          Precio:
        </span>
        {["fixed", "from", "negotiable"].map((type) => (
          <button
            key={type}
            onClick={() => togglePill("pricing_type", type, currentPricing)}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors ${
              currentPricing === type
                ? "border-pp-ink bg-pp-ink text-white"
                : "border-pp-ink bg-white text-pp-ink hover:bg-pp-border"
            }`}
          >
            {PRICING_LABELS[type]}
          </button>
        ))}
      </div>

      {/* ── Ciudad, orden ── */}
      <div className="flex flex-wrap items-end gap-3">
        <input
          type="text"
          placeholder="Ciudad…"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyCiudad()}
          className={`${inputClass} w-36`}
        />
        <button
          onClick={applyCiudad}
          className="rounded-full border border-pp-ink bg-white px-4 py-1.5 text-sm font-medium text-pp-ink hover:bg-pp-border"
        >
          Aplicar
        </button>

        <select
          value={currentOrden}
          onChange={(e) =>
            update("orden", e.target.value !== "reciente" ? e.target.value : null)
          }
          className={`${inputClass} ml-auto`}
        >
          <option value="reciente">Más recientes</option>
          <option value="precio_asc">Precio: menor a mayor</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="text-sm text-pp-ink2 underline decoration-dotted hover:text-pp-ink"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
