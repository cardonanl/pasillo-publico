import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido."),
  password: z.string().min(1, "Ingresa tu contraseña."),
});

export const registerSchema = z.object({
  email: z.string().email("Ingresa un correo válido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres."),
  username: z
    .string()
    .min(3, "El usuario debe tener al menos 3 caracteres.")
    .max(30, "El usuario no puede superar los 30 caracteres.")
    .regex(
      /^[a-z0-9-]+$/,
      "Solo minúsculas, números y guiones, sin espacios."
    ),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
