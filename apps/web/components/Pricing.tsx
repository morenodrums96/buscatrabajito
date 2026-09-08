"use client";

const PLANS = [
  {
    name: "Gratis",
    subtitle: "Para empezar",
    price: "$0",
    period: "para siempre",
    color: "#64748B",
    features: [
      "Alertas por correo · máx. 3/día",
      "OCC y Computrabajo",
      "1 perfil de búsqueda activo",
      "Generador de CV con IA · 1 vez",
      "Descarga tu CV en PDF",
      "Acceso al dashboard",
    ],
    cta: "Comenzar gratis",
    href: "/sign-up",
    highlight: false,
  },
  {
    name: "Buscador",
    subtitle: "Para encontrar",
    price: "$149",
    period: "MXN / mes",
    color: "#2563EB",
    features: [
      "Alertas por correo ilimitadas",
      "WhatsApp · máx. 30 mensajes/mes",
      "Todas las fuentes · 7 portales",
      "3 perfiles de búsqueda activos",
      "Ajuste de CV por vacante · 50/mes",
      "Descarga tu CV en PDF",
    ],
    cta: "Empezar con Buscador",
    href: "/sign-up?plan=buscador",
    highlight: true,
  },
  {
    name: "Aplicador",
    subtitle: "Para aplicar",
    price: "$299",
    period: "MXN / mes",
    color: "#0F2744",
    features: [
      "Todo lo del plan Buscador",
      "WhatsApp · máx. 60 mensajes/mes",
      "Perfiles de búsqueda ilimitados",
      "Ajuste de CV por vacante · 100/mes",
      "Preparación de entrevista con IA · 5/mes",
      "Historial de aplicaciones",
    ],
    cta: "Empezar con Aplicador",
    href: "/sign-up?plan=aplicador",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section
      id="precios"
      style={{
        background: "#FFFFFF",
        padding: "110px 24px 120px",
      }}
    >
      <div
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "64px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "5px 14px",
              borderRadius: "999px",
              background: "rgba(37, 99, 235, 0.08)",
              color: "#2563EB",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              fontFamily: "var(--font-inter), sans-serif",
              marginBottom: "16px",
            }}
          >
            Sin complicaciones
          </span>

          <h2
            style={{
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              fontWeight: 800,
              fontSize: "clamp(30px, 4vw, 42px)",
              lineHeight: 1.15,
              letterSpacing: "-1.5px",
              color: "#0F2744",
              margin: "0 0 14px",
            }}
          >
            Planes y precios
          </h2>

          <p
            style={{
              color: "#64748B",
              fontSize: "16px",
              lineHeight: 1.6,
              maxWidth: "500px",
              margin: "0 auto",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            Empieza gratis y actualiza cuando necesites más herramientas.
          </p>
        </div>

        {/* PLANS GRID */}
        <div
          className="pricing-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? "pricing-card pricing-card-highlight"
                  : "pricing-card"
              }
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                borderRadius: "20px",
                padding: "36px 30px",
                background: plan.highlight
                  ? "linear-gradient(180deg, #FFFFFF 0%, #F4F8FF 100%)"
                  : "#FFFFFF",
                border: plan.highlight
                  ? "2px solid #2563EB"
                  : "1px solid #E2E8F0",
                boxShadow: plan.highlight
                  ? "0 20px 40px -12px rgba(37, 99, 235, 0.18)"
                  : "0 4px 20px rgba(15, 39, 68, 0.04)",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {/* Popular badge */}
              {plan.highlight && (
                <div
                  style={{
                    position: "absolute",
                    top: "-14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "inline-flex",
                    alignItems: "center",
                    background: "#2563EB",
                    color: "#FFFFFF",
                    padding: "6px 16px",
                    borderRadius: "999px",
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.8px",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                    textTransform: "uppercase",
                  }}
                >
                  Más Popular
                </div>
              )}

              {/* PLAN NAME & SUBTITLE */}
              <div style={{ marginBottom: "20px" }}>
                <h3
                  style={{
                    fontFamily: "var(--font-plus-jakarta), sans-serif",
                    fontWeight: 800,
                    fontSize: "20px",
                    color: plan.highlight ? "#2563EB" : "#0F2744",
                    margin: "0 0 4px",
                    letterSpacing: "-0.4px",
                  }}
                >
                  {plan.name}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    color: "#64748B",
                    fontSize: "13px",
                    margin: 0,
                  }}
                >
                  {plan.subtitle}
                </p>
              </div>

              {/* PRICE */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "6px",
                  paddingBottom: "24px",
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-plus-jakarta), sans-serif",
                    fontWeight: 800,
                    fontSize: "clamp(36px, 4vw, 44px)",
                    lineHeight: 1,
                    letterSpacing: "-1.5px",
                    color: "#0F2744",
                  }}
                >
                  {plan.price}
                </span>
                <span
                  style={{
                    color: "#64748B",
                    fontSize: "13px",
                    fontWeight: 500,
                    fontFamily: "var(--font-inter), sans-serif",
                  }}
                >
                  {plan.period}
                </span>
              </div>

              {/* FEATURES */}
              <div style={{ flex: 1, paddingTop: "24px" }}>
                <p
                  style={{
                    margin: "0 0 16px",
                    color: "#0F2744",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-inter), sans-serif",
                  }}
                >
                  Incluye:
                </p>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 32px",
                  }}
                >
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        marginBottom: "14px",
                        color: "#334155",
                        fontSize: "13px",
                        lineHeight: 1.5,
                        fontFamily: "var(--font-inter), sans-serif",
                      }}
                    >
                      {/* Check Icon */}
                      <span
                        style={{
                          width: "20px",
                          height: "20px",
                          minWidth: "20px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: plan.highlight ? "#2563EB" : "#F1F5F9",
                          color: plan.highlight ? "#FFFFFF" : "#2563EB",
                          marginTop: "1px",
                        }}
                      >
                        <svg
                          viewBox="0 0 12 12"
                          width="10"
                          height="10"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M2 6l2.2 2.2L10 3.8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>

                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA BUTTON */}
              <a
                href={plan.href}
                className="pricing-button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  padding: "14px 20px",
                  borderRadius: "12px",
                  background: plan.highlight ? "#2563EB" : "#F8FAFC",
                  color: plan.highlight ? "#FFFFFF" : "#0F2744",
                  border: plan.highlight
                    ? "none"
                    : "1px solid #CBD5E1",
                  fontWeight: 700,
                  fontSize: "14px",
                  textDecoration: "none",
                  fontFamily: "var(--font-plus-jakarta), sans-serif",
                  transition: "all 0.2s ease",
                  boxSizing: "border-box",
                }}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* FOOTNOTE */}
        <p
          style={{
            textAlign: "center",
            margin: "36px auto 0",
            color: "#94A3B8",
            fontSize: "13px",
            fontFamily: "var(--font-inter), sans-serif",
          }}
        >
          Puedes cambiar de plan o cancelar tu suscripción en cualquier momento.
        </p>
      </div>

      <style>{`
        .pricing-card:hover {
          transform: translateY(-4px);
        }

        .pricing-card:not(.pricing-card-highlight):hover {
          border-color: #CBD5E1 !important;
          box-shadow: 0 12px 30px rgba(15, 39, 68, 0.08) !important;
        }

        .pricing-card-highlight:hover {
          box-shadow: 0 24px 48px -12px rgba(37, 99, 235, 0.25) !important;
        }

        .pricing-button:hover {
          opacity: 0.95;
        }

        @media (max-width: 900px) {
          .pricing-grid {
            grid-template-columns: 1fr 1fr !important;
          }

          .pricing-card:last-child {
            grid-column: 1 / -1;
            max-width: 440px;
            width: 100%;
            margin: 0 auto;
          }
        }

        @media (max-width: 620px) {
          .pricing-grid {
            grid-template-columns: 1fr !important;
          }

          .pricing-card:last-child {
            grid-column: auto;
            max-width: none;
          }
        }
      `}</style>
    </section>
  );
}