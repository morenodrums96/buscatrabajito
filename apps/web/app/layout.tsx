import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, Great_Vibes } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-great-vibes",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BuscoTrabajito — Encuentra tu próximo empleo",
  description:
    "Monitoreamos OCC, LinkedIn, Computrabajo y más cada 30 minutos. Te avisamos cuando aparece algo para ti.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#2563EB",
          colorBackground: "#ffffff",
          colorForeground: "#0F2744",
          borderRadius: "10px",
          fontFamily: "Inter, sans-serif",
        },
      }}
    >
      <html
        lang="es"
        data-scroll-behavior="smooth"
        className={`${plusJakarta.variable} ${inter.variable} ${greatVibes.variable}`}
      >
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}