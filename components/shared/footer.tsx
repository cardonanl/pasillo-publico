import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-pp-ink bg-pp-ink">
      <div className="mx-auto max-w-4xl px-6 py-14 text-center">
        <p className="font-display text-4xl font-black text-white">
          Pasillo Público
        </p>
        <p className="mt-2 font-display italic text-lg text-pp-yellow">
          Arte al alcance de todos y todas.
        </p>

        <Link
          href="/registro"
          className="mt-8 inline-flex items-center rounded-full border border-white bg-pp-yellow px-7 py-3 text-sm font-medium text-pp-ink shadow-[3px_3px_0_#ffffff] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#ffffff]"
        >
          Únete al pasillo →
        </Link>

        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-white/50">
          <Link href="/explorar" className="hover:text-white">
            Explorar obras
          </Link>
          <Link href="/servicios" className="hover:text-white">
            Servicios
          </Link>
          <Link href="/registro" className="hover:text-white">
            Registrarse
          </Link>
          <Link href="/login" className="hover:text-white">
            Ingresar
          </Link>
        </div>

        <p className="mt-8 text-xs text-white/30">
          Cali · Valle del Cauca · Colombia
        </p>
      </div>
    </footer>
  );
}
