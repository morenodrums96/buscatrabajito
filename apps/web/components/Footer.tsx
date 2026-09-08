"use client";

import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        background: "#0F2744",
        padding: "56px 24px 36px",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <div
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
        }}
      >
        {/* TOP SECTION */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "24px",
            paddingBottom: "36px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              fontWeight: 800,
              fontSize: "22px",
              letterSpacing: "-0.7px",
              textDecoration: "none",
              color: "#FFFFFF",
            }}
          >
            Busco<span style={{ color: "#60A5FA" }}>Trabajito</span>
          </Link>

          {/* Navigation links */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "28px",
              flexWrap: "wrap",
            }}
          >
            <a
              href="#como-funciona"
              className="footer-link"
              style={{
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "14px",
                textDecoration: "none",
                fontFamily: "var(--font-inter), sans-serif",
                transition: "color 0.2s ease",
              }}
            >
              Cómo funciona
            </a>
            <a
              href="#precios"
              className="footer-link"
              style={{
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "14px",
                textDecoration: "none",
                fontFamily: "var(--font-inter), sans-serif",
                transition: "color 0.2s ease",
              }}
            >
              Precios
            </a>
            <a
              href="/privacidad"
              className="footer-link"
              style={{
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "14px",
                textDecoration: "none",
                fontFamily: "var(--font-inter), sans-serif",
                transition: "color 0.2s ease",
              }}
            >
              Aviso de privacidad
            </a>
            <a
              href="/terminos"
              className="footer-link"
              style={{
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "14px",
                textDecoration: "none",
                fontFamily: "var(--font-inter), sans-serif",
                transition: "color 0.2s ease",
              }}
            >
              Términos
            </a>
          </nav>
        </div>

        {/* BOTTOM BAR */}
        <div
          style={{
            paddingTop: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <p
            style={{
              color: "rgba(255, 255, 255, 0.45)",
              fontSize: "13px",
              margin: 0,
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            © {currentYear} BuscoTrabajito. Todos los derechos reservados.
          </p>

          <span
            style={{
              color: "rgba(255, 255, 255, 0.45)",
              fontSize: "13px",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            México y LATAM 🇲🇽
          </span>
        </div>
      </div>

      <style>{`
        .footer-link:hover {
          color: #FFFFFF !important;
        }
      `}</style>
    </footer>
  );
}