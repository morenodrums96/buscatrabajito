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
      "Generador de CV con IA · 1 vez",
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
      "Generador de CV con IA · 2/mes",
      "Ajuste de CV por vacante · 2/mes",
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
      "Generador de CV con IA · 10/mes",
      "Ajuste de CV por vacante · 10/mes",
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
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "64px",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              color: "#2563EB",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              fontFamily:
                "var(--font-inter), sans-serif",
            }}
          >
            Sin complicaciones
          </p>

          <h2
            style={{
              fontFamily:
                "var(--font-plus-jakarta), sans-serif",

              fontWeight: 800,

              fontSize:
                "clamp(30px, 4vw, 44px)",

              lineHeight: 1.1,

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

              fontFamily:
                "var(--font-inter), sans-serif",
            }}
          >
            Empieza gratis y actualiza cuando
            necesites más herramientas.
          </p>
        </div>

        {/* =====================================================
            PLANS
        ====================================================== */}

        <div
          className="pricing-grid"
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",

            gap: "20px",

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

                borderRadius: "18px",

                padding: "32px",

                background:
                  plan.highlight
                    ? "#F5F9FF"
                    : "#FFFFFF",

                border:
                  plan.highlight
                    ? "1.5px solid #2563EB"
                    : "1px solid #E2E8F0",

                boxShadow:
                  plan.highlight
                    ? "0 12px 35px rgba(37,99,235,0.10)"
                    : "0 4px 18px rgba(15,39,68,0.035)",

                transition:
                  "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              {/* Popular badge */}
              {plan.highlight && (
                <div
                  style={{
                    position: "absolute",

                    top: "-12px",
                    left: "24px",

                    display: "inline-flex",
                    alignItems: "center",

                    background: "#2563EB",

                    color: "#FFFFFF",

                    padding: "5px 11px",

                    borderRadius: "6px",

                    fontFamily:
                      "var(--font-inter), sans-serif",

                    fontSize: "10px",

                    fontWeight: 700,

                    letterSpacing: "0.7px",
                  }}
                >
                  MÁS POPULAR
                </div>
              )}

              {/* =================================================
                  PLAN NAME
              ================================================== */}

              <div
                style={{
                  marginBottom: "22px",
                }}
              >
                <p
                  style={{
                    fontFamily:
                      "var(--font-plus-jakarta), sans-serif",

                    fontWeight: 800,

                    fontSize: "19px",

                    color: plan.color,

                    margin: "0 0 5px",

                    letterSpacing: "-0.3px",
                  }}
                >
                  {plan.name}
                </p>

                <p
                  style={{
                    fontFamily:
                      "var(--font-inter), sans-serif",

                    color: "#64748B",

                    fontSize: "13px",

                    margin: 0,
                  }}
                >
                  {plan.subtitle}
                </p>
              </div>

              {/* =================================================
                  PRICE
              ================================================== */}

              <div
                style={{
                  display: "flex",

                  alignItems: "baseline",

                  gap: "7px",

                  paddingBottom: "24px",

                  borderBottom:
                    "1px solid #E2E8F0",
                }}
              >
                <span
                  style={{
                    fontFamily:
                      "var(--font-plus-jakarta), sans-serif",

                    fontWeight: 800,

                    fontSize:
                      "clamp(36px, 4vw, 42px)",

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

                    fontSize: "12px",

                    fontFamily:
                      "var(--font-inter), sans-serif",
                  }}
                >
                  {plan.period}
                </span>
              </div>

              {/* =================================================
                  FEATURES
              ================================================== */}

              <div
                style={{
                  flex: 1,

                  paddingTop: "25px",
                }}
              >
                <p
                  style={{
                    margin:
                      "0 0 16px",

                    color: "#475569",

                    fontSize: "12px",

                    fontWeight: 600,

                    fontFamily:
                      "var(--font-inter), sans-serif",
                  }}
                >
                  Incluye:
                </p>

                <ul
                  style={{
                    listStyle: "none",

                    padding: 0,

                    margin: 0,
                  }}
                >
                  {plan.features.map(
                    (feature) => (
                      <li
                        key={feature}
                        style={{
                          display: "flex",

                          alignItems:
                            "flex-start",

                          gap: "10px",

                          marginBottom: "14px",

                          color: "#334155",

                          fontSize: "13px",

                          lineHeight: 1.5,

                          fontFamily:
                            "var(--font-inter), sans-serif",
                        }}
                      >
                        {/* Check */}
                        <span
                          style={{
                            width: "18px",
                            height: "18px",

                            minWidth: "18px",

                            borderRadius: "50%",

                            display: "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "center",

                            marginTop: "0px",

                            background:
                              plan.highlight
                                ? "#DBEAFE"
                                : "#F1F5F9",
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
                              stroke={
                                plan.highlight
                                  ? "#2563EB"
                                  : "#64748B"
                              }
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>

                        <span>
                          {feature}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* =================================================
                  CTA
              ================================================== */}

              <a
                href={plan.href}
                className="pricing-button"
                style={{
                  display: "block",

                  width: "100%",

                  textAlign: "center",

                  padding: "13px 16px",

                  borderRadius: "9px",

                  background:
                    plan.highlight
                      ? "#2563EB"
                      : "transparent",

                  color:
                    plan.highlight
                      ? "#FFFFFF"
                      : plan.color,

                  border:
                    plan.highlight
                      ? "1.5px solid #2563EB"
                      : `1.5px solid ${plan.color}`,

                  fontWeight: 700,

                  fontSize: "13px",

                  textDecoration: "none",

                  fontFamily:
                    "var(--font-plus-jakarta), sans-serif",

                  transition:
                    "background 0.2s ease, color 0.2s ease, transform 0.2s ease",

                  boxSizing: "border-box",
                }}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* =====================================================
            FOOTNOTE
        ====================================================== */}

        <p
          style={{
            textAlign: "center",

            margin:
              "28px auto 0",

            color: "#94A3B8",

            fontSize: "12px",

            fontFamily:
              "var(--font-inter), sans-serif",
          }}
        >
          Puedes cambiar de plan o cancelar cuando quieras.
        </p>
      </div>

      {/* =======================================================
          RESPONSIVE
      ======================================================== */}

      <style>{`
        .pricing-card:hover {
          transform: translateY(-3px);
          box-shadow:
            0 12px 30px rgba(15,39,68,0.08);
        }

        .pricing-card-highlight:hover {
          box-shadow:
            0 16px 40px rgba(37,99,235,0.14);
        }

        .pricing-button:hover {
          transform: translateY(-1px);
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