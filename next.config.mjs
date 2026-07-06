/** @type {import('next').NextConfig} */

// Deriva el hostname exacto del proyecto Supabase desde la variable de entorno,
// evitando el wildcard *.supabase.co que permitiría imágenes de cualquier proyecto.
const supabaseHostname = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "*.supabase.co"; // fallback solo si la var no está definida (dev sin .env)
  }
})();

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
