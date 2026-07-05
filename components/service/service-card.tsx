import Link from "next/link";

function formatServicePrice(
  pricingType: "fixed" | "from" | "negotiable",
  price: number | null,
  priceUnit: string | null
): string {
  if (pricingType === "negotiable") return "A convenir";
  if (price === null) return "";
  const formatted = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  const withUnit = priceUnit ? `${formatted} / ${priceUnit}` : formatted;
  return pricingType === "from" ? `Desde ${withUnit}` : withUnit;
}

interface ServiceCardProps {
  id: string;
  title: string;
  category: string;
  pricing_type: "fixed" | "from" | "negotiable";
  price: number | null;
  price_unit: string | null;
}

export function ServiceCard({
  id,
  title,
  category,
  pricing_type,
  price,
  price_unit,
}: ServiceCardProps) {
  const priceDisplay = formatServicePrice(pricing_type, price, price_unit);

  return (
    <Link href={`/servicio/${id}`} className="group relative block pt-4">
      {/* Pin de tablón */}
      <div className="absolute left-1/2 top-0 z-10 h-7 w-7 -translate-x-1/2 rounded-full border-2 border-pp-ink bg-pp-yellow shadow-[2px_2px_0_#0A0A0A]" />

      <div className="rounded-md border border-dashed border-pp-ink bg-white p-5 pt-7 transition-shadow group-hover:shadow-[4px_4px_0_#0A0A0A]">
        <span className="inline-block rounded-full border border-pp-blue bg-pp-blue-lt px-2.5 py-0.5 text-[11px] font-medium text-pp-blue">
          {category}
        </span>
        <p className="mt-2 line-clamp-2 font-display text-base font-bold leading-snug text-pp-ink">
          {title}
        </p>
        {priceDisplay && (
          <p className="mt-2 text-sm font-medium text-pp-ink">{priceDisplay}</p>
        )}
      </div>
    </Link>
  );
}
