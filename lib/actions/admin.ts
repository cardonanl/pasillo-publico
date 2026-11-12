"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Guard: verifica que el usuario activo sea admin; devuelve su id ───────
async function assertAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile?.is_admin) throw new Error("No autorizado");
  return user.id;
}

// ── Guard: las acciones destructivas no aplican a cuentas admin ───────────
async function assertNotAdminTarget(
  adminId: string,
  targetId: string
): Promise<string | null> {
  if (adminId === targetId) {
    return "No puedes aplicar esta acción a tu propia cuenta.";
  }
  const supabase = await createClient();
  const { data: target, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", targetId)
    .single();
  if (error || !target) return "Usuario no encontrado.";
  if (target.is_admin) return "No se puede aplicar esta acción a un admin.";
  return null;
}

// ── Aprobar artista ───────────────────────────────────────────────────────
export async function approveArtist(
  id: string
): Promise<{ error?: string }> {
  try {
    await assertAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", id);

  if (error) return { error: "No se pudo aprobar el artista." };

  revalidatePath("/admin");
  revalidatePath(`/admin/artista/${id}`);
  return {};
}

// ── Suspender artista (is_approved = false) ───────────────────────────────
export async function rejectArtist(
  id: string
): Promise<{ error?: string }> {
  try {
    await assertAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_approved: false })
    .eq("id", id);

  if (error) return { error: "No se pudo suspender el artista." };

  revalidatePath("/admin");
  revalidatePath(`/admin/artista/${id}`);
  return {};
}

// ── Eliminar cuenta (admin client + CASCADE en DB) ────────────────────────
export async function deleteArtist(
  userId: string
): Promise<{ error?: string }> {
  let adminId: string;
  try {
    adminId = await assertAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const targetError = await assertNotAdminTarget(adminId, userId);
  if (targetError) return { error: targetError };

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) return { error: "No se pudo eliminar la cuenta." };

  revalidatePath("/admin");
  return {};
}

// ── Generar link de recuperación de contraseña ────────────────────────────
export async function generateResetLink(
  userId: string
): Promise<{ link?: string; error?: string }> {
  let adminId: string;
  try {
    adminId = await assertAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const targetError = await assertNotAdminTarget(adminId, userId);
  if (targetError) return { error: targetError };

  const adminClient = createAdminClient();

  // Obtener email del usuario
  const { data: userData, error: userError } =
    await adminClient.auth.admin.getUserById(userId);
  if (userError || !userData.user?.email) {
    return { error: "No se pudo obtener el email del usuario." };
  }

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "recovery",
    email: userData.user.email,
  });

  if (error) return { error: "No se pudo generar el enlace de recuperación." };

  const link = data.properties?.action_link;
  if (!link) return { error: "El enlace generado está vacío." };

  return { link };
}
