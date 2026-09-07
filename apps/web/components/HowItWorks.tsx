"use client";

const STEPS = [
  {
    num: "01",
    title: "Crea tu perfil",
    desc: "Sube tu CV o deja que nuestra IA lo cree por ti.",
  },
  {
    num: "02",
    title: "Define qué buscas",
    desc: "Indica el puesto, experiencia, ubicación y modalidad que buscas.",
  },
  {
    num: "03",
    title: "Buscamos por ti",
    desc: "Revisamos múltiples portales de empleo automáticamente cada 30 minutos.",
    featured: true,
  },
  {
    num: "04",
    title: "Te avisamos",
    desc: "Cuando encontramos una vacante que encaja contigo, te enviamos una alerta.",
  },
  {
    num: "05",
    title: "Ajustamos tu CV",
    desc: "La IA adapta tu CV para destacar lo que busca cada vacante.",
  },
  {
    num: "06",
    title: "Tú decides y aplicas",
    desc: "Revisas las oportunidades, eliges dónde aplicar y llevas el control.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="como-funciona"
      style={{
        background: "#F8FAFC",
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
            Paso a paso
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
            Cómo funciona
          </h2>

          <p
            style={{
              color: "#64748B",
              fontSize: "16px",
              lineHeight: 1.6,
              maxWidth: "540px",
              margin: "0 auto",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            Configura tu búsqueda una vez y deja que BuscoTrabajito haga el
            trabajo pesado.
          </p>
        </div>

        {/* PROCESS GRID */}
        <div
          className="steps-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
          }}
        >
          {STEPS.map((step) => (
            <div
              key={step.num}
              style={{
                position: "relative",
                background: step.featured ? "#FFFFFF" : "#FFFFFF",
                borderRadius: "16px",
                padding: "32px 28px",
                border: step.featured
                  ? "2px solid #2563EB"
                  : "1px solid #E2E8F0",
                boxShadow: step.featured
                  ? "0 12px 30px -8px rgba(37, 99, 235, 0.18)"
                  : "0 4px 20px rgba(15, 39, 68, 0.03)",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                if (!step.featured) {
                  e.currentTarget.style.borderColor = "#CBD5E1";
                  e.currentTarget.style.boxShadow =
                    "0 12px 28px rgba(15, 39, 68, 0.07)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                if (!step.featured) {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.boxShadow =
                    "0 4px 20px rgba(15, 39, 68, 0.03)";
                }
              }}
            >
              <div>
                {/* Header Card: Número e indicador opcional */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: step.featured ? "#2563EB" : "#F1F5F9",
                      color: step.featured ? "#FFFFFF" : "#2563EB",
                      fontFamily: "var(--font-plus-jakarta), sans-serif",
                      fontSize: "14px",
                      fontWeight: 800,
                    }}
                  >
                    {step.num}
                  </div>

                  {step.featured && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#2563EB",
                        background: "rgba(37, 99, 235, 0.1)",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Automatizado
                    </span>
                  )}
                </div>

                {/* Título */}
                <h3
                  style={{
                    fontFamily: "var(--font-plus-jakarta), sans-serif",
                    fontWeight: 700,
                    fontSize: "18px",
                    color: "#0F2744",
                    margin: "0 0 10px",
                    letterSpacing: "-0.4px",
                  }}
                >
                  {step.title}
                </h3>

                {/* Descripción */}
                <p
                  style={{
                    color: "#64748B",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    margin: 0,
                    fontFamily: "var(--font-inter), sans-serif",
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM STATEMENT */}
        <div
          style={{
            marginTop: "64px",
            padding: "24px 32px",
            borderRadius: "16px",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            textAlign: "center",
            boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#475569",
              fontSize: "15px",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            <strong style={{ color: "#0F2744", fontWeight: 700 }}>
              Tú no tienes que buscar todos los días.
            </strong>{" "}
            Nosotros lo hacemos por ti.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .steps-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 580px) {
          .steps-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}