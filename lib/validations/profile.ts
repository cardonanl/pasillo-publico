import { z } from "zod";

// Valida instagram sin transformar: acepta username, @username o URL completa
function isValidInstagramInput(val: string): boolean {
  if (val.trim() === "") return true;
  const urlMatch = val.match(/instagram\.com\/([^/?#]+)/i);
  const username = urlMatch ? urlMatch[1] : val.trim().replace(/^@/, "");
  return /^[a-zA-Z0-9._]{1,30}$/.test(username);
}

// Valida website sin transformar: acepta con o sin https://
function isValidWebsiteInput(val: string): boolean {
  if (val.trim() === "") return true;
  const url = /^https?:\/\//i.test(val.trim()) ? val.trim() : `https://${val.trim()}`;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export const profileSchema = z.object({
  full_name: z.string().max(100, "Máximo 100 caracteres").optional(),
  bio: z.string().max(500, "Máximo 500 caracteres").optional(),
  city: z.string().max(100, "Máximo 100 caracteres").optional(),
  instagram_url: z
    .string()
    .refine(isValidInstagramInput, {
      message: "Usuario de Instagram inválido — solo letras, números, puntos y guiones bajos",
    })
    .optional(),
  website_url: z
    .string()
    .refine(isValidWebsiteInput, { message: "URL inválida" })
    .optional(),
  whatsapp: z
    .string()
    .regex(/^\d{7,15}$/, "Solo dígitos con código de país, ej: 573001234567")
    .or(z.literal(""))
    .optional(),
  color_primary: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Hexadecimal inválido, ej: #1AA6C9")
    .or(z.literal(""))
    .optional(),
  color_secondary: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Hexadecimal inválido, ej: #FEC70B")
    .or(z.literal(""))
    .optional(),
  is_artist: z.boolean(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
