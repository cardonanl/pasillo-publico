"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { artworkSchema, type ArtworkInput } from "@/lib/validations/artwork";

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
