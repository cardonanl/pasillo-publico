"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { serviceSchema, type ServiceInput } from "@/lib/validations/service";

export async function createService(
  input: ServiceInput,
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
    return { error: "Solo artistas aprobados pueden publicar servicios." };
  }

  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos." };

  const {
    title,
    description,
    category,
    pricing_type,
    price,
    price_unit,
    delivery_time,
  } = parsed.data;

  const { error: insertError } = await supabase.from("services").insert({
    artist_id: user.id,
    title: title.trim(),
    description: description?.trim() || null,
    category,
    pricing_type,
    price:
      pricing_type !== "negotiable" && price && price !== ""
        ? parseFloat(price)
        : null,
    price_unit: price_unit?.trim() || null,
    delivery_time: delivery_time?.trim() || null,
    images: imageUrls,
    is_active: true,
  });

  if (insertError) {
    return { error: "No pudimos guardar el servicio. Intenta de nuevo." };
  }

  revalidatePath("/mi-perfil");
  return {};
}
