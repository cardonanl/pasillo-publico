"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        // El trigger handle_new_user usa este username para crear el perfil.
        data: { username: values.username },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already been")) {
        setServerError("Ya existe una cuenta con este correo.");
      } else if (msg.includes("password")) {
        setServerError("La contraseña no cumple los requisitos mínimos.");
      } else {
        setServerError("No pudimos crear tu cuenta. Intenta de nuevo.");
      }
      return;
    }

    // Si Supabase requiere confirmación de correo, no hay sesión todavía.
    if (data.session) {
      router.push("/mi-perfil");
      router.refresh();
    } else {
      setConfirmEmail(true);
    }
  }

  if (confirmEmail) {
    return (
      <div className="rounded-md border border-pp-ink bg-pp-blue-lt px-4 py-5 text-pp-ink">
        <p className="font-medium">Te enviamos un correo de confirmación.</p>
        <p className="mt-1 text-sm text-pp-ink2">
          Revisa tu bandeja de entrada y confirma tu cuenta para poder ingresar.
        </p>
        <Link
          href="/login"
          className="mt-3 inline-block font-medium text-pp-blue underline decoration-wavy underline-offset-4"
        >
          Ir a ingresar
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <p className="rounded-md border border-pp-ink bg-pp-yellow/30 px-3 py-2 text-sm text-pp-ink">
          {serverError}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">Nombre de usuario</Label>
        <Input
          id="username"
          type="text"
          autoComplete="username"
          placeholder="tu-usuario"
          {...register("username")}
        />
        <p className="text-xs text-pp-ink2">
          Minúsculas, números y guiones. Será tu enlace público.
        </p>
        {errors.username && (
          <p className="text-sm text-destructive">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full border border-pp-ink bg-pp-yellow text-pp-ink shadow-[3px_3px_0_#0A0A0A] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-pp-yellow hover:shadow-[2px_2px_0_#0A0A0A]"
      >
        {isSubmitting ? "Creando cuenta…" : "Únete al pasillo"}
      </Button>

      <p className="text-center text-sm text-pp-ink2">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-pp-blue underline decoration-wavy underline-offset-4"
        >
          Ingresar
        </Link>
      </p>
    </form>
  );
}
