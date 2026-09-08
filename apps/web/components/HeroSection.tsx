"use client";

import Link from "next/link";

const TRUST_BADGES = [
  "100% gratis para empezar",
  "Sin spam",
  "7 portales de empleo",
  "Alertas cada 30 min",
];

export default function HeroSection() {
  return (
    <section style={{ position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "#09172A", // Tono azul noche profundo y moderno
        }}
      >
        {/* BACKGROUND IMAGE */}
        <img
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1800&q=85"
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            filter: "brightness(0.38) contrast(1.05)",
            transform: "scale(1.02)",
          }}
        />

        {/* OVERLAYS & AMBIENT GLOW */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(9,23,42,0.65) 0%, rgba(9,23,42,0.40) 50%, rgba(9,23,42,0.92) 100%)",
          }}
        />

        {/* Dynamic Glow Effect behind headline */}
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "350px",
            background:
              "radial-gradient(ellipse at center, rgba(37,99,235,0.22) 0%, rgba(0,0,0,0) 70%)",
            pointerEvents: "none",
            filter: "blur(40px)",
          }}
        />

        {/* HERO CONTENT */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "130px 24px 80px",
          }}
        >
          {/* Eyebrow / Pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              marginBottom: "32px",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#60A5FA",
                boxShadow: "0 0 10px #60A5FA",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
            <span
              style={{
                color: "#E2E8F0",
                fontSize: "12.5px",
                fontWeight: 600,
                fontFamily: "var(--font-inter), sans-serif",
                letterSpacing: "0.2px",
              }}
            >
              Búsqueda automática cada 30 minutos
            </span>
          </div>

          {/* HEADLINE */}
          <h1
            style={{
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              fontWeight: 800,
              fontSize: "clamp(38px, 5.8vw, 68px)",
              lineHeight: 1.08,
              letterSpacing: "-2.2px",
              color: "#FFFFFF",
              maxWidth: "860px",
              margin: "0 0 22px",
            }}
          >
            Nosotros buscamos. <br />
            <span
              style={{
                background: "linear-gradient(135deg, #93C5FD 0%, #3B82F6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Tú eliges
            </span>{" "}
            dónde aplicar.
          </h1>

          {/* DESCRIPTION */}
          <p
            style={{
              color: "rgba(226, 232, 240, 0.85)",
              fontSize: "clamp(15px, 1.8vw, 18px)",
              lineHeight: 1.6,
              maxWidth: "600px",
              margin: "0 0 40px",
              fontFamily: "var(--font-inter), sans-serif",
              fontWeight: 400,
            }}
          >
            BuscoTrabajito revisa OCC, LinkedIn, Computrabajo y más portales — y
            te avisa en tiempo real cuando encuentra la vacante ideal para ti.
          </p>

          {/* CTA GROUP */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <Link
              href="/sign-up"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "16px 36px",
                background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "15px",
                borderRadius: "10px",
                textDecoration: "none",
                fontFamily: "var(--font-plus-jakarta), sans-serif",
                boxShadow:
                  "0 10px 30px -5px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 16px 36px -4px rgba(37, 99, 235, 0.55), inset 0 1px 0 rgba(255,255,255,0.3)";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px -5px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)";
              }}
            >
              Crear cuenta gratis
              <span style={{ fontSize: "16px" }}>&rarr;</span>
            </Link>

            <p
              style={{
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "12px",
                margin: 0,
                fontFamily: "var(--font-inter), sans-serif",
              }}
            >
              Sin tarjetas de crédito · Sin spam · Cancela cuando quieras
            </p>
          </div>
        </div>

        {/* TRUST BADGES */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 20px 40px" }}>
          <ul
            className="trust-list"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "12px 32px",
              maxWidth: "850px",
              margin: "0 auto",
              padding: 0,
              listStyle: "none",
            }}
          >
            {TRUST_BADGES.map((badge) => (
              <li
                key={badge}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "rgba(255, 255, 255, 0.78)",
                  fontSize: "13px",
                  fontFamily: "var(--font-inter), sans-serif",
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "rgba(96, 165, 250, 0.12)",
                    border: "1px solid rgba(96, 165, 250, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg viewBox="0 0 12 12" fill="none" width="10" height="10">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="#60A5FA"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {badge}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* TRANSITION WAVE */}
      <div
        style={{
          height: "60px",
          background: "#F8FAFC",
          position: "relative",
          marginTop: "-1px",
        }}
      >
        <svg
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            top: "-1px",
            left: 0,
            width: "100%",
            height: "60px",
          }}
          aria-hidden="true"
        >
          <path
            d="M0,30 C320,60 420,0 720,30 C1020,60 1120,0 1440,30 L1440,60 L0,60 Z"
            fill="#F8FAFC"
          />
        </svg>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @media (max-width: 700px) {
          .desktop-nav { display: none !important; }
          .trust-list { gap: 10px 20px !important; }
        }
      `}</style>
    </section>
  );
}