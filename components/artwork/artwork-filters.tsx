"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface Category {
  id: number;
  name: string;
}

const inputClass =
  "rounded-md border border-pp-ink bg-white px-3 py-1.5 text-sm placeholder:text-pp-ink2 focus:outline-none focus:ring-2 focus:ring-pp-ink";

export function ArtworkFilters({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentCat = searchParams.get("categoria") ?? "";
  const currentEstado = searchParams.get("estado") ?? "";
  const currentOrden = searchParams.get("orden") ?? "reciente";

  const [precioMin, setPrecioMin] = useState(
    searchParams.get("precio_min") ?? ""
  );
  const [precioMax, setPrecioMax] = useState(
    searchParams.get("precio_max") ?? ""
  );
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

  function applyTextFilters() {
    const params = new URLSearchParams(searchParams.toString());
    if (precioMin) params.set("precio_min", precioMin);
    else params.delete("precio_min");
    if (precioMax) params.set("precio_max", precioMax);
    else params.delete("precio_max");
    if (ciudad.trim()) params.set("ciudad", ciudad.trim());
    else params.delete("ciudad");
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters =
    currentCat ||
    currentEstado ||
    searchParams.get("precio_min") ||
    searchParams.get("precio_max") ||
    searchParams.get("ciudad");

  return (
    <div className="space-y-4 rounded-md border border-pp-border bg-pp-bg2 p-4">
      {/* ── Categorías ── */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const id = String(cat.id);
          const active = currentCat === id;
          return (
            <button
              key={cat.id}
              onClick={() => togglePill("categoria", id, currentCat)}
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

      {/* ── Disponibilidad ── */}
      <div className="flex flex-wrap gap-2">
        <span className="flex items-center text-xs font-medium text-pp-ink2">
          Estado:
        </span>
        {[
          { value: "available", label: "Disponible" },
          { value: "sold", label: "Vendida" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => togglePill("estado", value, currentEstado)}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors ${
              currentEstado === value
                ? "border-pp-ink bg-pp-ink text-white"
                : "border-pp-ink bg-white text-pp-ink hover:bg-pp-border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Precio, ciudad, orden ── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            placeholder="$ mín"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyTextFilters()}
            className={`${inputClass} w-24`}
          />
          <span className="text-pp-ink2">—</span>
          <input
            type="number"
            placeholder="$ máx"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyTextFilters()}
            className={`${inputClass} w-24`}
          />
        </div>

        <input
          type="text"
          placeholder="Ciudad…"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyTextFilters()}
          className={`${inputClass} w-32`}
        />

        <button
          onClick={applyTextFilters}
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
          <option value="precio_desc">Precio: mayor a menor</option>
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
