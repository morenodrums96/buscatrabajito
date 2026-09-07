"use client";

const TRUST_BADGES = [
  "100% gratis para empezar",
  "Sin spam",
  "7 portales de empleo",
  "Alertas cada 30 min",
];

export default function HeroSection() {
  return (
    <section>
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "#0F2744",
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
            filter: "brightness(0.58)",
            transform: "scale(1.02)",
          }}
        />

        {/* DARK OVERLAY */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to bottom, rgba(8,24,43,0.55) 0%, rgba(8,24,43,0.50) 40%, rgba(8,24,43,0.78) 100%)`,
          }}
        />

        {/* BLUE TINT */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(15,39,68,0.25), transparent 50%, rgba(15,39,68,0.20))",
            pointerEvents: "none",
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
            padding: "120px 24px 100px",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 14px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.09)",
              border: "1px solid rgba(255,255,255,0.20)",
              marginBottom: "28px",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#60A5FA",
                boxShadow: "0 0 0 4px rgba(96,165,250,0.15)",
                animation: "pulse 2s infinite",
              }}
            />
            <span
              style={{
                color: "rgba(255,255,255,0.88)",
                fontSize: "12px",
                fontWeight: 600,
                fontFamily: "var(--font-inter), sans-serif",
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
              fontSize: "clamp(38px, 6vw, 68px)",
              lineHeight: 1.06,
              letterSpacing: "-2.8px",
              color: "#FFFFFF",
              maxWidth: "850px",
              margin: "0 0 24px",
            }}
          >
            Nosotros buscamos.
            <br />
            <span style={{ color: "#60A5FA" }}>Tú eliges</span>{" "}
            dónde aplicar.
          </h1>

          {/* DESCRIPTION */}
          <p
            style={{
              color: "rgba(255,255,255,0.82)",
              fontSize: "clamp(15px, 2vw, 18px)",
              lineHeight: 1.65,
              maxWidth: "610px",
              margin: "0 0 36px",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            BuscoTrabajito revisa OCC, LinkedIn, Computrabajo y más portales — y te avisa cuando encuentra algo para ti.
          </p>

          <div>
            <a
              href="/sign-up"
              style={{
                display: "inline-block",
                padding: "15px 32px",
                background: "#2563EB",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "15px",
                borderRadius: "10px",
                textDecoration: "none",
                fontFamily: "var(--font-plus-jakarta), sans-serif",
                boxShadow: "0 15px 40px rgba(0,0,0,0.22)",
                transition: "background 0.2s ease, transform 0.2s ease",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.background = "#1D4ED8";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.background = "#2563EB";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
                            Crear cuenta gratis &rarr;
            </a>
            <p
              style={{
                color: "rgba(255,255,255,0.58)",
                fontSize: "12px",
                marginTop: "12px",
                fontFamily: "var(--font-inter), sans-serif",
              }}
            >
              Gratis para empezar · Sin spam · Tú decides cuándo aplicar
            </p>
          </div>
        </div>

        {/* TRUST BADGES */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 20px 32px" }}>
          <ul
            className="trust-list"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "10px 34px",
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
                  gap: "7px",
                  color: "rgba(255,255,255,0.76)",
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
                    background: "rgba(96,165,250,0.18)",
                    border: "1px solid rgba(96,165,250,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg viewBox="0 0 12 12" fill="none" width="10" height="10">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="#93C5FD"
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

      {/* TRANSITION */}
      <div style={{ height: "70px", background: "#F8FAFC", position: "relative", marginTop: "-1px" }}>
        <svg
          viewBox="0 0 1440 70"
          preserveAspectRatio="none"
          style={{ position: "absolute", top: "-1px", left: 0, width: "100%", height: "70px" }}
          aria-hidden="true"
        >
          <path d="M0,35 C240,70 480,5 720,35 C960,65 1200,5 1440,35 L1440,70 L0,70 Z" fill="#F8FAFC" />
        </svg>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @media (max-width: 700px) {
          .desktop-nav { display: none !important; }
          .trust-list { gap: 10px 18px !important; }
        }
      `}</style>
    </section>
  );
}