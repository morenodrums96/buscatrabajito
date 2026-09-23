import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (y su dependencia pdfjs-dist) resuelven en tiempo de ejecución
  // la ruta a su archivo de worker; si Turbopack los empaqueta, esa ruta se
  // rompe ("Setting up fake worker failed"). Los excluimos del bundling para
  // que se carguen con require/import nativo de Node.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],

  // Next.js bloquea por defecto peticiones cross-origin al dev server
  // (solo permite localhost) — sin esto, exponer `pnpm dev` vía ngrok para
  // pruebas temporales con alguien más se queda pantalla en blanco / sin
  // login. El wildcard cubre que ngrok cambie de subdominio cada sesión
  // (cuenta gratis); quitar esto no afecta producción, solo `next dev`.
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app"],
};

export default nextConfig;
