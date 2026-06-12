import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";

const pillBase =
  "inline-flex items-center rounded-full border border-pp-ink px-4 py-2 text-sm font-medium transition-transform";
const pillSecondary = "bg-white hover:bg-pp-bg2";
const pillPrimary =
  "bg-pp-yellow shadow-[3px_3px_0_#0A0A0A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#0A0A0A]";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-pp-ink bg-pp-bg">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-display text-xl font-black text-pp-ink"
        >
          Pasillo <span className="italic font-normal text-pp-blue">Público</span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/mi-perfil" className={`${pillBase} ${pillSecondary}`}>
                Mi perfil
              </Link>
              <form action={logout}>
                <button type="submit" className={`${pillBase} ${pillSecondary}`}>
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={`${pillBase} ${pillSecondary}`}>
                Ingresar
              </Link>
              <Link href="/registro" className={`${pillBase} ${pillPrimary}`}>
                Únete al pasillo
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
