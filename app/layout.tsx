import type { Metadata } from "next";
import { Playfair_Display, Inter_Tight } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pasillo Público — Arte al alcance de todos y todas",
  description:
    "Marketplace de arte y servicios creativos colombiano, con sede en Cali y el Valle del Cauca.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn(playfair.variable, interTight.variable)}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
