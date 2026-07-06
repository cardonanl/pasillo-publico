"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { serviceSchema, type ServiceInput } from "@/lib/validations/service";
import { createService } from "@/lib/actions/service";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const textareaClass =
  "w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const PRICE_LABELS: Record<ServiceInput["pricing_type"], string> = {
  fixed: "Precio (COP)",
  from: "Precio desde (COP)",
  negotiable: "A convenir",
};

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

export function ServiceForm({ profileId, categories }: Props) {
  const router = useRouter();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { pricing_type: "fixed" as const },
  });

  const pricingType = watch("pricing_type");
  const selectedCategory = watch("category");

  useEffect(() => {
    if (pricingType === "negotiable") {
      setValue("price", "");
    }
  }, [pricingType, setValue]);

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

  // ── Submit ─────────────────────────────────────────────────────────

  async function onSubmit(values: ServiceInput) {
    setImageError(null);
    setServerError(null);

    setUploading(true);
    const supabase = createClient();
    const urls: string[] = [];

    for (const item of images) {
      const ext = item.file.name.split(".").pop() ?? "jpg";
      const path = `${profileId}/servicio-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("services")
        .upload(path, item.file);

      if (upErr) {
        setImageError("No pudimos subir una de las imágenes. Intenta de nuevo.");
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from("services").getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    const result = await createService(values, urls);
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
      {/* Campo oculto para categoría — gestionado con setValue */}
      <input type="hidden" {...register("category")} />

      {/* ── Imágenes de portafolio ── */}
      <fieldset className="space-y-3">
        <legend className="font-display text-lg font-bold text-pp-ink">
          Imágenes de portafolio
        </legend>
        <p className="text-sm text-pp-ink2">
          Hasta 5 imágenes · máx 10 MB cada una. Opcional, pero recomendado.
        </p>

        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div
              key={img.previewUrl}
              className="flex flex-col items-center gap-1"
            >
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
            placeholder="Ej: Retratos por comisión, Guiones para redes"
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
            rows={4}
            placeholder="Cuéntanos qué incluye este servicio, tu proceso, qué necesitas del cliente…"
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
      </fieldset>

      {/* ── Categoría ── */}
      {categories.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="font-display text-lg font-bold text-pp-ink">
            Categoría <span className="text-pp-ink2">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setValue("category", cat.name as ServiceInput["category"], { shouldValidate: true })
                  }
                  disabled={busy}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors ${
                    isSelected
                      ? "border-pp-ink bg-pp-ink text-white"
                      : "border-pp-ink bg-white text-pp-ink hover:bg-pp-bg2"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
          {errors.category && (
            <p className="text-sm text-destructive">
              {errors.category.message}
            </p>
          )}
        </fieldset>
      )}

      {/* ── Precio y entrega ── */}
      <fieldset className="space-y-5">
        <legend className="font-display text-lg font-bold text-pp-ink">
          Precio y entrega
        </legend>

        <div className="space-y-2">
          <Label>Tipo de precio</Label>
          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                value="fixed"
                className="h-4 w-4 border-pp-ink"
                {...register("pricing_type")}
              />
              Precio fijo
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                value="from"
                className="h-4 w-4 border-pp-ink"
                {...register("pricing_type")}
              />
              Desde (precio mínimo)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                value="negotiable"
                className="h-4 w-4 border-pp-ink"
                {...register("pricing_type")}
              />
              A convenir
            </label>
          </div>
          {errors.pricing_type && (
            <p className="text-sm text-destructive">
              {errors.pricing_type.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">{PRICE_LABELS[pricingType]}</Label>
            <div className="relative">
              {pricingType !== "negotiable" && (
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-pp-ink2">
                  $
                </span>
              )}
              <Input
                id="price"
                inputMode="decimal"
                placeholder={
                  pricingType === "negotiable" ? "A convenir" : "250000"
                }
                disabled={busy || pricingType === "negotiable"}
                className={pricingType !== "negotiable" ? "pl-6" : ""}
                {...register("price")}
              />
            </div>
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_unit">Unidad de precio</Label>
            <Input
              id="price_unit"
              placeholder='por guion, por m², por obra'
              disabled={busy || pricingType === "negotiable"}
              {...register("price_unit")}
            />
            {errors.price_unit && (
              <p className="text-sm text-destructive">
                {errors.price_unit.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="delivery_time">Tiempo de entrega</Label>
          <Input
            id="delivery_time"
            placeholder="3 semanas, a convenir, depende del proyecto…"
            disabled={busy}
            {...register("delivery_time")}
          />
          {errors.delivery_time && (
            <p className="text-sm text-destructive">
              {errors.delivery_time.message}
            </p>
          )}
        </div>
      </fieldset>

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
          {uploading
            ? "Subiendo imágenes…"
            : isSubmitting
              ? "Guardando…"
              : "Publicar servicio"}
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
