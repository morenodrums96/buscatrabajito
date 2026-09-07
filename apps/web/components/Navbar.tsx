"use client";
import { useEffect, useState } from "react";

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
        top: 0, left: 0, right: 0,
        zIndex: 50,
        height: "68px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        background: scrolled ? "rgba(15, 39, 68, 0.94)" : "linear-gradient(to bottom, rgba(0,0,0,0.28), transparent)",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
        boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.12)" : "none",
        transition: "background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
      }}
    >
      <a href="/" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "21px", letterSpacing: "-0.7px", textDecoration: "none", color: "#FFFFFF" }}>
        Busco<span style={{ color: "#60A5FA" }}>Trabajito</span>
      </a>

      <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {[
          { label: "Cómo funciona", href: "#como-funciona" },
          { label: "Precios", href: "#precios" },
        ].map(({ label, href }) => (
          <a key={label} href={href}
            style={{ color: "rgba(255,255,255,0.78)", fontSize: "13px", fontWeight: 600, padding: "8px 12px", borderRadius: "8px", textDecoration: "none", fontFamily: "var(--font-inter), sans-serif", transition: "color 0.2s ease, background 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#FFFFFF"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.78)"; e.currentTarget.style.background = "transparent"; }}
          >{label}</a>
        ))}
        <a href="/sign-up"
          style={{ marginLeft: "12px", background: "#2563EB", color: "#FFFFFF", fontSize: "13px", fontWeight: 700, padding: "10px 18px", borderRadius: "8px", textDecoration: "none", fontFamily: "var(--font-plus-jakarta), sans-serif", boxShadow: "0 4px 14px rgba(37,99,235,0.30)", transition: "transform 0.2s ease, background 0.2s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#1D4ED8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#2563EB"; e.currentTarget.style.transform = "translateY(0)"; }}
        >Registrate</a>
      </nav>
    </header>
  );
}