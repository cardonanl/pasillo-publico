import { z } from "zod";

const currentYear = new Date().getFullYear();

export const artworkSchema = z.object({
  title: z
    .string()
    .min(1, "El título es obligatorio")
    .max(200, "Máximo 200 caracteres"),
  description: z.string().max(1000, "Máximo 1000 caracteres").optional(),
  technique: z.string().max(200, "Máximo 200 caracteres").optional(),
  dimensions: z.string().max(100, "Máximo 100 caracteres").optional(),
  year: z
    .string()
    .refine(
      (v) =>
        v === "" ||
        (/^\d{4}$/.test(v) &&
          Number(v) >= 1800 &&
          Number(v) <= currentYear),
      { message: `Año inválido — entre 1800 y ${currentYear}` }
    )
    .optional(),
  price: z
    .string()
    .refine(
      (v) => v === "" || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) >= 0),
      { message: "Precio inválido — solo números, ej: 250000" }
    )
    .optional(),
  status: z.enum(["available", "not_for_sale"] as const, {
    error: "Selecciona el estado de la obra",
  }),
  categories: z
    .array(z.string().regex(/^\d+$/, "ID de categoría inválido"))
    .optional(),
});

export type ArtworkInput = z.infer<typeof artworkSchema>;
