"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const textareaClass =
  "w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

interface Props {
  profile: Profile;
}

export function ProfileForm({ profile }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name ?? "",
      bio: profile.bio ?? "",
      city: profile.city ?? "",
      instagram_url: profile.instagram_url ?? "",
      website_url: profile.website_url ?? "",
      whatsapp: profile.whatsapp ?? "",
      color_primary: profile.color_primary ?? "",
      color_secondary: profile.color_secondary ?? "",
      is_artist: profile.is_artist,
    },
  });

  const colorPrimary = watch("color_primary") ?? "";
  const colorSecondary = watch("color_secondary") ?? "";

  async function uploadImage(
    file: File,
    bucket: "avatars" | "banners",
    maxBytes: number,
    setUrl: (url: string) => void,
    setLoading: (v: boolean) => void,
    field: "avatar_url" | "banner_url"
  ) {
    setUploadError(null);
    if (file.size > maxBytes) {
      setUploadError(
        `El archivo supera el tamaño máximo (${maxBytes / 1024 / 1024} MB).`
      );
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${profile.id}/${field.replace("_url", "")}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (upErr) {
      setUploadError("No pudimos subir la imagen. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const { error: dbErr } = await supabase
      .from("profiles")
      .update({ [field]: data.publicUrl })
      .eq("id", profile.id);

    if (!dbErr) setUrl(data.publicUrl);
    else setUploadError("Imagen subida pero no pudimos actualizar el perfil.");
    setLoading(false);
  }

  async function onSubmit(values: ProfileInput) {
    setServerError(null);
    const result = await updateProfile(values);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    router.push("/mi-perfil");
    router.refresh();
  }

  const initials = (
    profile.full_name?.[0] ?? profile.username[0] ?? "?"
  ).toUpperCase();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* ── Banner ── */}
      <div>
        <label className="group block cursor-pointer">
          <div className="relative h-36 w-full overflow-hidden rounded-md border border-pp-ink bg-pp-bg2">
            {bannerUrl && (
              <Image
                src={bannerUrl}
                alt="Banner"
                fill
                className="object-cover"
              />
            )}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                bannerUrl
                  ? "bg-pp-ink/40 opacity-0 group-hover:opacity-100"
                  : "opacity-100"
              }`}
            >
              <span className="text-sm font-medium text-white">
                {uploadingBanner
                  ? "Subiendo…"
                  : bannerUrl
                  ? "Cambiar banner"
                  : "Subir banner"}
              </span>
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploadingBanner}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file)
                void uploadImage(
                  file,
                  "banners",
                  5 * 1024 * 1024,
                  setBannerUrl,
                  setUploadingBanner,
                  "banner_url"
                );
            }}
          />
        </label>
        <p className="mt-1 text-xs text-pp-ink2">
          Banner · PNG, JPG, WEBP · máx 5 MB · ratio 3:1 recomendado
        </p>
      </div>

      {/* ── Avatar ── */}
      <div className="flex items-center gap-4">
        <label className="group relative cursor-pointer">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-pp-ink bg-pp-bg2">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-bold text-pp-ink">
                {initials}
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-pp-ink/40 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-xs text-white">
                {uploadingAvatar ? "…" : "✎"}
              </span>
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploadingAvatar}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file)
                void uploadImage(
                  file,
                  "avatars",
                  2 * 1024 * 1024,
                  setAvatarUrl,
                  setUploadingAvatar,
                  "avatar_url"
                );
            }}
          />
        </label>
        <div>
          <p className="text-sm font-medium text-pp-ink">Foto de perfil</p>
          <p className="text-xs text-pp-ink2">PNG, JPG, WEBP · máx 2 MB</p>
        </div>
      </div>

      {uploadError && (
        <p className="rounded-md border border-pp-ink bg-pp-yellow/30 px-3 py-2 text-sm text-pp-ink">
          {uploadError}
        </p>
      )}

      {/* ── Información básica ── */}
      <fieldset className="space-y-5">
        <legend className="mb-4 font-display text-lg font-bold text-pp-ink">
          Información básica
        </legend>

        <div className="space-y-2">
          <Label htmlFor="full_name">Nombre completo</Label>
          <Input
            id="full_name"
            placeholder="Tu nombre o nombre artístico"
            {...register("full_name")}
          />
          {errors.full_name && (
            <p className="text-sm text-destructive">
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            placeholder="Cali, Colombia"
            {...register("city")}
          />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio / presentación</Label>
          <textarea
            id="bio"
            rows={4}
            placeholder="Cuéntanos quién eres y qué haces…"
            className={textareaClass}
            {...register("bio")}
          />
          {errors.bio && (
            <p className="text-sm text-destructive">{errors.bio.message}</p>
          )}
        </div>
      </fieldset>

      {/* ── Contacto y redes ── */}
      <fieldset className="space-y-5">
        <legend className="mb-4 font-display text-lg font-bold text-pp-ink">
          Contacto y redes
        </legend>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            placeholder="573001234567"
            {...register("whatsapp")}
          />
          <p className="text-xs text-pp-ink2">
            Con código de país, sin el + · ej: 573001234567
          </p>
          {errors.whatsapp && (
            <p className="text-sm text-destructive">
              {errors.whatsapp.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram_url">Instagram</Label>
          <Input
            id="instagram_url"
            placeholder="@tu-usuario, tu-usuario o instagram.com/tu-usuario"
            {...register("instagram_url")}
          />
          <p className="text-xs text-pp-ink2">
            Acepta usuario, @usuario o la URL completa
          </p>
          {errors.instagram_url && (
            <p className="text-sm text-destructive">
              {errors.instagram_url.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="website_url">Sitio web</Label>
          <Input
            id="website_url"
            placeholder="misitio.com o https://misitio.com"
            {...register("website_url")}
          />
          <p className="text-xs text-pp-ink2">
            Se agrega https:// automáticamente si no lo incluyes
          </p>
          {errors.website_url && (
            <p className="text-sm text-destructive">
              {errors.website_url.message}
            </p>
          )}
        </div>
      </fieldset>

      {/* ── Colores de perfil ── */}
      <fieldset className="space-y-5">
        <legend className="mb-1 font-display text-lg font-bold text-pp-ink">
          Colores de tu perfil
        </legend>
        <p className="text-sm text-pp-ink2">
          Definen el acento visual de tu página de artista.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="color_primary">Color primario</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Selector color primario"
                value={
                  /^#[0-9A-Fa-f]{6}$/.test(colorPrimary)
                    ? colorPrimary
                    : "#1AA6C9"
                }
                onChange={(e) =>
                  setValue("color_primary", e.target.value, {
                    shouldValidate: true,
                  })
                }
                className="h-9 w-12 cursor-pointer rounded border border-pp-ink p-0.5"
              />
              <Input
                id="color_primary"
                placeholder="#1AA6C9"
                {...register("color_primary")}
              />
            </div>
            {errors.color_primary && (
              <p className="text-sm text-destructive">
                {errors.color_primary.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color_secondary">Color secundario</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Selector color secundario"
                value={
                  /^#[0-9A-Fa-f]{6}$/.test(colorSecondary)
                    ? colorSecondary
                    : "#FEC70B"
                }
                onChange={(e) =>
                  setValue("color_secondary", e.target.value, {
                    shouldValidate: true,
                  })
                }
                className="h-9 w-12 cursor-pointer rounded border border-pp-ink p-0.5"
              />
              <Input
                id="color_secondary"
                placeholder="#FEC70B"
                {...register("color_secondary")}
              />
            </div>
            {errors.color_secondary && (
              <p className="text-sm text-destructive">
                {errors.color_secondary.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* ── Soy artista ── */}
      <fieldset className="rounded-md border border-pp-border p-5">
        <div className="flex items-start gap-3">
          <input
            id="is_artist"
            type="checkbox"
            className="mt-1 h-4 w-4 cursor-pointer rounded border-pp-ink"
            {...register("is_artist")}
          />
          <div>
            <Label htmlFor="is_artist" className="cursor-pointer font-medium">
              Soy artista o creador/a
            </Label>
            <p className="mt-1 text-sm text-pp-ink2">
              Activa esto para publicar obras y servicios. Un administrador
              revisará y aprobará tu perfil antes de que sea visible
              públicamente.
            </p>
          </div>
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
          disabled={isSubmitting || uploadingAvatar || uploadingBanner}
          className="rounded-full border border-pp-ink bg-pp-yellow text-pp-ink shadow-[3px_3px_0_#0A0A0A] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-pp-yellow hover:shadow-[2px_2px_0_#0A0A0A]"
        >
          {isSubmitting ? "Guardando…" : "Guardar cambios"}
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
