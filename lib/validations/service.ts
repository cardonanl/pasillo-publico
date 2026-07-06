import { z } from "zod";

const SERVICE_CATEGORIES = [
  "Muralismo",
  "Retrato por comisión",
  "Pintura por comisión",
  "Escritura y guiones",
  "Ilustración",
  "Diseño gráfico",
  "Fotografía por encargo",
  "Tatuaje",
  "UI/UX",
  "Web design",
  "Front end",
  "NFTs y crypto art",
  "Visuales para música",
  "Curaduría",
  "Valorizaciones",
  "Otro",
] as const;

export const serviceSchema = z.object({
  title: z
    .string()
    .min(1, "El título es obligatorio")
    .max(200, "Máximo 200 caracteres"),
  description: z.string().max(1000, "Máximo 1000 caracteres").optional(),
  category: z.enum(SERVICE_CATEGORIES, { error: "Categoría inválida" }),
  pricing_type: z.enum(["fixed", "from", "negotiable"] as const, {
    error: "Selecciona el tipo de precio",
  }),
  price: z
    .string()
    .refine(
      (v) => v === "" || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) >= 0),
      { message: "Precio inválido — solo números, ej: 250000" }
    )
    .optional(),
  price_unit: z.string().max(100, "Máximo 100 caracteres").optional(),
  delivery_time: z.string().max(100, "Máximo 100 caracteres").optional(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
