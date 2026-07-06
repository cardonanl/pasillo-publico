"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { artworkSchema, type ArtworkInput } from "@/lib/validations/artwork";

// Extrae el path relativo al bucket desde una URL pública de Storage.
// "https://xxx.supabase.co/storage/v1/object/public/artworks/uid/file.jpg"
// → "uid/file.jpg"
function storagePath(url: string): string | null {
  const m = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export async function createArtwork(
  input: ArtworkInput,
  imageUrls: string[]
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_artist, is_approved")
    .eq("id", user.id)
    .single();

  if (!profile?.is_artist || !profile?.is_approved) {
    return { error: "Solo artistas aprobados pueden publicar obras." };
  }

  const parsed = artworkSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos." };

  if (imageUrls.length === 0) {
    return { error: "Agrega al menos una imagen de la obra." };
  }

  const {
    title,
    description,
    technique,
    dimensions,
    year,
    price,
    status,
    categories,
  } = parsed.data;

  const { data: artwork, error: insertError } = await supabase
    .from("artworks")
    .insert({
      artist_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      technique: technique?.trim() || null,
      dimensions: dimensions?.trim() || null,
      year: year && year !== "" ? parseInt(year, 10) : null,
      price: price && price !== "" ? parseFloat(price) : null,
      status,
      images: imageUrls,
    })
    .select("id")
    .single();

  if (insertError || !artwork) {
    return { error: "No pudimos guardar la obra. Intenta de nuevo." };
  }

  if (categories && categories.length > 0) {
    await supabase.from("artwork_category_map").insert(
      categories.map((catId) => ({
        artwork_id: artwork.id,
        category_id: parseInt(catId, 10),
      }))
    );
  }

  revalidatePath("/mi-perfil");
  return {};
}

export async function deleteArtwork(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "No autenticado." };

  const { data: artwork } = await supabase
    .from("artworks")
    .select("artist_id, images")
    .eq("id", id)
    .single();

  if (!artwork) return { error: "Obra no encontrada." };
  if (artwork.artist_id !== user.id) return { error: "No autorizado." };

  // Borrar imágenes del bucket (error de storage no bloquea el delete del registro)
  const paths = (artwork.images as string[])
    .map(storagePath)
    .filter((p): p is string => p !== null);
  if (paths.length > 0) {
    await supabase.storage.from("artworks").remove(paths);
  }

  const { error } = await supabase.from("artworks").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar la obra." };

  revalidatePath("/mi-perfil");
  revalidatePath("/explorar");
  return {};
}
