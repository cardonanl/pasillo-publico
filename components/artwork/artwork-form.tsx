"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { artworkSchema, type ArtworkInput } from "@/lib/validations/artwork";
import { createArtwork } from "@/lib/actions/artwork";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const textareaClass =
  "w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

interface Category {
  id: number;
  name: string;
}

interface ImageItem {
  file: File;
  previewUrl: string;
}

interface Props {
  profileId: string;
  categories: Category[];
}

export function ArtworkForm({ profileId, categories }: Props) {
  const router = useRouter();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ArtworkInput>({
    resolver: zodResolver(artworkSchema),
    defaultValues: { status: "available" },
  });

  // ── Gestión de imágenes ────────────────────────────────────────────

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    setImageError(null);
    const remaining = 5 - images.length;
    const incoming = Array.from(fileList).slice(0, remaining);
    const oversized = incoming.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      setImageError(
        `${oversized.length > 1 ? "Algunas imágenes superan" : "Una imagen supera"} los 10 MB y no se agregó.`
      );
    }
    const valid = incoming.filter((f) => f.size <= 10 * 1024 * 1024);
    if (valid.length === 0) return;
    setImages((prev) => [
      ...prev,
      ...valid.map((f) => ({ file: f, previewUrl: URL.createObjectURL(f) })),
    ]);
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function moveImage(from: number, to: number) {
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  // ── Submit ─────────────────────────────────────────────────────────

  async function onSubmit(values: ArtworkInput) {
    setImageError(null);
    setServerError(null);

    if (images.length === 0) {
      setImageError("Agrega al menos una imagen de la obra.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const urls: string[] = [];

    for (const item of images) {
      const ext = item.file.name.split(".").pop() ?? "jpg";
      const path = `${profileId}/obra-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("artworks")
        .upload(path, item.file);

      if (upErr) {
        setImageError("No pudimos subir una de las imágenes. Intenta de nuevo.");
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from("artworks").getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    const result = await createArtwork(
      { ...values, categories: selectedCategories },
      urls
    );
    setUploading(false);

    if (result.error) {
      setServerError(result.error);
      return;
    }

    router.push("/mi-perfil");
    router.refresh();
  }

  const busy = isSubmitting || uploading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* ── Imágenes ── */}
      <fieldset className="space-y-3">
        <legend className="font-display text-lg font-bold text-pp-ink">
          Imágenes
        </legend>
        <p className="text-sm text-pp-ink2">
          Hasta 5 imágenes · máx 10 MB cada una. La primera es la portada.
        </p>

        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={img.previewUrl} className="flex flex-col items-center gap-1">
              <div className="relative h-28 w-28 overflow-hidden rounded-md border border-pp-ink bg-pp-bg2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt={`Imagen ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                {i === 0 && (
                  <span className="absolute left-1 top-1 -rotate-1 rounded-full border border-pp-ink bg-pp-yellow px-1.5 py-0.5 text-[10px] font-bold text-pp-ink">
                    Portada
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  disabled={busy}
                  aria-label="Eliminar imagen"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-pp-ink bg-white text-xs font-bold text-pp-ink hover:bg-pp-yellow"
                >
                  ✕
                </button>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveImage(i, i - 1)}
                  disabled={i === 0 || busy}
                  aria-label="Mover a la izquierda"
                  className="flex h-6 w-6 items-center justify-center rounded border border-pp-ink bg-white text-xs hover:bg-pp-bg2 disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(i, i + 1)}
                  disabled={i === images.length - 1 || busy}
                  aria-label="Mover a la derecha"
                  className="flex h-6 w-6 items-center justify-center rounded border border-pp-ink bg-white text-xs hover:bg-pp-bg2 disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </div>
          ))}

          {images.length < 5 && (
            <label className="flex flex-col items-center gap-1 cursor-pointer">
              <div className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-pp-ink bg-pp-bg2 text-pp-ink2 hover:bg-pp-border transition-colors">
                <span className="text-2xl leading-none">+</span>
                <span className="text-xs">
                  {images.length === 0 ? "Agregar imagen" : "Agregar más"}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={busy}
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <span className="invisible text-xs">·</span>
            </label>
          )}
        </div>

        {imageError && (
          <p className="rounded-md border border-pp-ink bg-pp-yellow/30 px-3 py-2 text-sm text-pp-ink">
            {imageError}
          </p>
        )}
      </fieldset>

      {/* ── Información básica ── */}
      <fieldset className="space-y-5">
        <legend className="font-display text-lg font-bold text-pp-ink">
          Información básica
        </legend>

        <div className="space-y-2">
          <Label htmlFor="title">
            Título <span className="text-pp-ink2">*</span>
          </Label>
          <Input
            id="title"
            placeholder="Nombre de la obra"
            disabled={busy}
            {...register("title")}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            rows={3}
            placeholder="Cuéntanos sobre esta obra…"
            className={textareaClass}
            disabled={busy}
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="technique">Técnica</Label>
            <Input
              id="technique"
              placeholder="Óleo sobre lienzo"
              disabled={busy}
              {...register("technique")}
            />
            {errors.technique && (
              <p className="text-sm text-destructive">
                {errors.technique.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dimensions">Dimensiones</Label>
            <Input
              id="dimensions"
              placeholder="40 × 60 cm"
              disabled={busy}
              {...register("dimensions")}
            />
            {errors.dimensions && (
              <p className="text-sm text-destructive">
                {errors.dimensions.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* ── Precio y estado ── */}
      <fieldset className="space-y-5">
        <legend className="font-display text-lg font-bold text-pp-ink">
          Precio y estado
        </legend>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="year">Año</Label>
            <Input
              id="year"
              inputMode="numeric"
              placeholder={String(new Date().getFullYear())}
              maxLength={4}
              disabled={busy}
              {...register("year")}
            />
            {errors.year && (
              <p className="text-sm text-destructive">{errors.year.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Precio (COP)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-pp-ink2">
                $
              </span>
              <Input
                id="price"
                inputMode="decimal"
                placeholder="250000"
                className="pl-6"
                disabled={busy}
                {...register("price")}
              />
            </div>
            <p className="text-xs text-pp-ink2">
              Déjalo vacío si no está en venta o no quieres publicarlo
            </p>
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Estado</Label>
          <div className="flex gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                value="available"
                className="h-4 w-4 border-pp-ink"
                {...register("status")}
              />
              En venta
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                value="not_for_sale"
                className="h-4 w-4 border-pp-ink"
                {...register("status")}
              />
              No en venta
            </label>
          </div>
          {errors.status && (
            <p className="text-sm text-destructive">{errors.status.message}</p>
          )}
        </div>
      </fieldset>

      {/* ── Categorías ── */}
      {categories.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="font-display text-lg font-bold text-pp-ink">
            Categorías
          </legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const id = String(cat.id);
              const checked = selectedCategories.includes(id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(id)}
                  disabled={busy}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors ${
                    checked
                      ? "border-pp-ink bg-pp-ink text-white"
                      : "border-pp-ink bg-white text-pp-ink hover:bg-pp-bg2"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {serverError && (
        <p className="rounded-md border border-pp-ink bg-pp-yellow/30 px-3 py-2 text-sm text-pp-ink">
          {serverError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={busy}
          className="rounded-full border border-pp-ink bg-pp-yellow text-pp-ink shadow-[3px_3px_0_#0A0A0A] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-pp-yellow hover:shadow-[2px_2px_0_#0A0A0A]"
        >
          {uploading ? "Subiendo imágenes…" : isSubmitting ? "Guardando…" : "Publicar obra"}
        </Button>
        <Link
          href="/mi-perfil"
          className="inline-flex items-center rounded-full border border-pp-ink bg-white px-4 py-2 text-sm font-medium text-pp-ink transition-colors hover:bg-pp-bg2"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
