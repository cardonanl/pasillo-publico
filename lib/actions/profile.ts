"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";

function nullify(val: string | undefined | null): string | null {
  return val && val.trim() !== "" ? val.trim() : null;
}

// Extrae el username de cualquier formato de Instagram; devuelve null si vacío
function normalizeInstagram(raw: string | undefined | null): string | null {
  if (!raw || raw.trim() === "") return null;
  const val = raw.trim();
  const urlMatch = val.match(/instagram\.com\/([^/?#]+)/i);
  const username = urlMatch ? urlMatch[1] : val.replace(/^@/, "");
  return username || null;
}

// Garantiza que la URL del sitio web lleva https://; devuelve null si vacío
function normalizeWebsite(raw: string | undefined | null): string | null {
  if (!raw || raw.trim() === "") return null;
  const val = raw.trim();
  return /^https?:\/\//i.test(val) ? val : `https://${val}`;
}

export async function updateProfile(
  input: ProfileInput
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos." };

  const {
    full_name,
    bio,
    city,
    instagram_url,
    website_url,
    whatsapp,
    color_primary,
    color_secondary,
    is_artist,
  } = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: nullify(full_name),
      bio: nullify(bio),
      city: nullify(city),
      instagram_url: normalizeInstagram(instagram_url),
      website_url: normalizeWebsite(website_url),
      whatsapp: nullify(whatsapp),
      color_primary: nullify(color_primary),
      color_secondary: nullify(color_secondary),
      is_artist,
    })
    .eq("id", user.id);

  if (error) return { error: "No pudimos guardar los cambios. Intenta de nuevo." };

  revalidatePath("/mi-perfil");
  return {};
}
