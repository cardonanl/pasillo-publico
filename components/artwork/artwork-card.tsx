import Image from "next/image";
import Link from "next/link";

function formatCOP(price: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

interface ArtworkCardProps {
  id: string;
  title: string;
  technique: string | null;
  price: number | null;
  status: "available" | "sold" | "not_for_sale";
  images: string[];
}

export function ArtworkCard({
  id,
  title,
  technique,
  price,
  status,
  images,
}: ArtworkCardProps) {
  const coverImage = images[0] ?? null;
  const isSold = status === "sold";

  return (
    <Link
      href={`/obra/${id}`}
      className="group block overflow-hidden rounded-md border border-pp-ink bg-white transition-shadow hover:shadow-[4px_4px_0_#0A0A0A]"
    >
      <div className="relative aspect-square overflow-hidden bg-pp-bg2">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-pp-ink2">
            Sin imagen
          </div>
        )}
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center bg-pp-ink/50">
            <span className="-rotate-12 rounded-full border-2 border-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Vendida
            </span>
          </div>
        )}
      </div>

      <div className="space-y-0.5 p-3">
        <p className="line-clamp-1 font-display text-sm font-bold leading-tight text-pp-ink">
          {title}
        </p>
        {technique && (
          <p className="line-clamp-1 text-xs text-pp-ink2">{technique}</p>
        )}
        {price !== null && !isSold && (
          <p className="text-sm font-medium text-pp-ink">{formatCOP(price)}</p>
        )}
        {isSold && (
          <p className="text-xs text-pp-ink2">Vendida</p>
        )}
      </div>
    </Link>
  );
}
