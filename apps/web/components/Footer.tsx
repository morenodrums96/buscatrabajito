"use client";

import Link from "next/link";
import { Globe } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#040810] text-slate-400 py-12 px-6 border-t border-slate-800/80">
      <div className="max-w-6xl mx-auto">
        {/* TOP SECTION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-white transition-opacity hover:opacity-90"
          >
            Busco<span className="text-sky-400">Trabajito</span>
          </Link>

          {/* Navigation links */}
          <nav className="flex items-center gap-6 sm:gap-8 flex-wrap justify-center">
            <a
              href="#como-funciona"
              className="text-xs font-medium text-slate-400 hover:text-sky-400 transition-colors"
            >
              Cómo funciona
            </a>
            <a
              href="#precios"
              className="text-xs font-medium text-slate-400 hover:text-sky-400 transition-colors"
            >
              Precios
            </a>
            <Link
              href="/privacidad"
              className="text-xs font-medium text-slate-400 hover:text-sky-400 transition-colors"
            >
              Aviso de privacidad
            </Link>
            <Link
              href="/terminos"
              className="text-xs font-medium text-slate-400 hover:text-sky-400 transition-colors"
            >
              Términos
            </Link>
          </nav>
        </div>

        {/* BOTTOM BAR */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="margin-0">
            © {currentYear} BuscoTrabajito. Todos los derechos reservados.
          </p>

          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>México y LATAM 🇲🇽</span>
          </div>
        </div>
      </div>
    </footer>
  );
}