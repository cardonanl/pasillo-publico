import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Únete al pasillo — Pasillo Público",
};

export default function RegistroPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-2 font-display text-4xl font-black text-pp-ink">
        Únete al <span className="italic text-pp-blue">pasillo</span>
      </h1>
      <p className="mb-8 text-pp-ink2">
        Crea tu cuenta y empieza a mostrar tu arte.
      </p>
      <RegisterForm />
    </main>
  );
}
