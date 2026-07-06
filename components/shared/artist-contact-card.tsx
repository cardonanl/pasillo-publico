import Image from "next/image";
import Link from "next/link";

interface Props {
  username: string;
  full_name: string | null;
  city: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  instagram_url: string | null;
  website_url: string | null;
  contactMessage: string;
}

export function ArtistContactCard({
  username,
  full_name,
  city,
  avatar_url,
  whatsapp,
  instagram_url,
  website_url,
  contactMessage,
}: Props) {
  const name = full_name ?? username;
  const initials = (full_name?.[0] ?? username[0] ?? "?").toUpperCase();

  // Prioridad de contacto: WhatsApp → Instagram → sitio web
  let contactHref: string | null = null;
  let contactLabel = "Me interesa";
  if (whatsapp) {
    contactHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(contactMessage)}`;
    contactLabel = "Me interesa";
  } else if (instagram_url) {
    contactHref = `https://instagram.com/${instagram_url}`;
    contactLabel = "Contactar en Instagram";
  } else if (website_url) {
    contactHref = website_url;
    contactLabel = "Visitar sitio web";
  }

  return (
    <div className="space-y-4 rounded-md border border-pp-ink bg-white p-4">
      {/* Avatar + nombre + ciudad */}
      <Link
        href={`/artista/${username}`}
        className="flex items-center gap-3 transition-opacity hover:opacity-75"
      >
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-pp-ink bg-pp-bg2">
          {avatar_url ? (
            <Image
              src={avatar_url}
              alt={name}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-lg font-bold text-pp-ink">
              {initials}
            </span>
          )}
        </div>
        <div>
          <p className="font-display text-sm font-bold text-pp-ink">{name}</p>
          {city && <p className="text-xs text-pp-ink2">{city}</p>}
          <p className="text-xs text-pp-blue">Ver galería →</p>
        </div>
      </Link>

      {/* Botón de contacto */}
      {contactHref && (
        <a
          href={contactHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center rounded-full border border-pp-ink bg-pp-yellow px-4 py-2.5 text-sm font-medium text-pp-ink shadow-[3px_3px_0_#0A0A0A] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#0A0A0A]"
        >
          {contactLabel} ↗
        </a>
      )}
    </div>
  );
}
