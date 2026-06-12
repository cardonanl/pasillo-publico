import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Ingresar — Pasillo Público",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-2 font-display text-4xl font-black text-pp-ink">
        Ingresar
      </h1>
      <p className="mb-8 text-pp-ink2">
        Bienvenido de vuelta al <span className="italic text-pp-blue">pasillo</span>.
      </p>
      <LoginForm />
    </main>
  );
}
