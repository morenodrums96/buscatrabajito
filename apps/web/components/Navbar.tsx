"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-[68px] flex items-center justify-between px-4 sm:px-10 transition-all duration-300 backdrop-blur-md ${
        scrolled
          ? "bg-[#060E1A]/85 border-b border-white/10 shadow-lg shadow-black/20"
          : "bg-gradient-to-b from-black/50 via-black/20 to-transparent border-b border-transparent"
      }`}
    >
      {/* LOGO */}
      <Link
        href="/"
        className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-0.5 hover:opacity-90 transition-opacity"
      >
        Busco<span className="text-sky-400">Trabajito</span>
      </Link>

      {/* NAVIGATION */}
      <nav className="flex items-center gap-1 sm:gap-2">
        <a
          href="#como-funciona"
          className="hidden md:inline-block text-xs font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all"
        >
          Cómo funciona
        </a>

        <a
          href="#precios"
          className="hidden md:inline-block text-xs font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all"
        >
          Precios
        </a>

        {/* AUTH ACTIONS */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 ml-1 sm:ml-4 sm:pl-4 sm:border-l sm:border-white/15">
          {/* Iniciar sesión visible en todas las pantallas */}
          <Link
            href="/sign-in"
            className="text-xs font-medium text-slate-300 hover:text-white px-2.5 sm:px-3 py-2 rounded-lg hover:bg-white/5 transition-all whitespace-nowrap"
          >
            Iniciar sesión
          </Link>

          {/* CTA: CREAR CUENTA */}
          <Link
            href="/sign-up"
            className="group relative inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 hover:border-sky-400/50 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-12 transition-transform" />
            <span>Crear cuenta</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}