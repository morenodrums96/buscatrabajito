"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: "68px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        background: scrolled
          ? "rgba(11, 23, 42, 0.85)"
          : "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid transparent",
        boxShadow: scrolled
          ? "0 4px 20px rgba(0, 0, 0, 0.25)"
          : "none",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* LOGO */}
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-plus-jakarta), sans-serif",
          fontWeight: 800,
          fontSize: "20px",
          letterSpacing: "-0.5px",
          textDecoration: "none",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          gap: "2px",
        }}
      >
        Busco
        <span style={{ color: "#60A5FA" }}>Trabajito</span>
      </Link>

      {/* NAVIGATION */}
      <nav
        className="desktop-nav"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {[
          { label: "Cómo funciona", href: "#como-funciona" },
          { label: "Precios", href: "#precios" },
        ].map(({ label, href }) => (
          <a
            key={label}
            href={href}
            style={{
              color: "rgba(255, 255, 255, 0.72)",
              fontSize: "13px",
              fontWeight: 500,
              padding: "8px 14px",
              borderRadius: "8px",
              textDecoration: "none",
              fontFamily: "var(--font-inter), sans-serif",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#FFFFFF";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.72)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            {label}
          </a>
        ))}

        {/* AUTH */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginLeft: "16px",
            paddingLeft: "16px",
            borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          {/* Iniciar sesión */}
          <Link
            href="/sign-in"
            style={{
              color: "rgba(255, 255, 255, 0.85)",
              fontSize: "13px",
              fontWeight: 500,
              padding: "8px 14px",
              borderRadius: "8px",
              textDecoration: "none",
              fontFamily: "var(--font-inter), sans-serif",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#FFFFFF";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Iniciar sesión
          </Link>

          {/* Crear cuenta (Rediseñado: Subtle Glass / Border Accent) */}
          <Link
            href="/sign-up"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 600,
              padding: "8px 16px",
              borderRadius: "8px",
              textDecoration: "none",
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.borderColor = "rgba(96, 165, 250, 0.5)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(96, 165, 250, 0.15)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.18)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Crear cuenta
          </Link>
        </div>
      </nav>
    </header>
  );
}