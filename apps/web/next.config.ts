import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (y su dependencia pdfjs-dist) resuelven en tiempo de ejecución
  // la ruta a su archivo de worker; si Turbopack los empaqueta, esa ruta se
  // rompe ("Setting up fake worker failed"). Los excluimos del bundling para
  // que se carguen con require/import nativo de Node.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
