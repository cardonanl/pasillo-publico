import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Devuelve la URL solo si es http(s); evita hrefs `javascript:` u otros
// esquemas guardados directamente en la DB.
export function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  try {
    const { protocol } = new URL(url)
    return protocol === "https:" || protocol === "http:" ? url : undefined
  } catch {
    return undefined
  }
}

// ¿La URL es un objeto público de `bucket` dentro de la carpeta del usuario?
// Formato: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{uid}/{archivo}
export function isOwnStorageUrl(
  url: string,
  bucket: string,
  uid: string
): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return false
  const prefix = `${base.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${uid}/`
  return url.startsWith(prefix) && !url.slice(prefix.length).includes("/")
}
