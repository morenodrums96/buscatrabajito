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
            marginBottom: "76px",
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
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            Así de fácil
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
            Cómo funciona
          </h2>

          <p
            style={{
              color: "#64748B",
              fontSize: "16px",
              lineHeight: 1.6,
              maxWidth: "540px",
              margin: "0 auto",
              fontFamily:
                "var(--font-inter), sans-serif",
            }}
          >
            Configura tu búsqueda una vez y deja que
            BuscaTrabajito haga el trabajo pesado.
          </p>
        </div>

        {/* PROCESS */}
        <div
          style={{
            position: "relative",
          }}
        >
          {/* Línea horizontal desktop */}
          <div
            className="process-line"
            style={{
              position: "absolute",
              top: "25px",
              left: "8%",
              right: "8%",
              height: "1px",
              background: "#CBD5E1",
              zIndex: 0,
            }}
          />

          <div
            className="steps-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              columnGap: "70px",
              rowGap: "70px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {STEPS.map((step) => (
              <div
                key={step.num}
                style={{
                  position: "relative",
                }}
              >
                {/* Número */}
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    background: step.featured
                      ? "#2563EB"
                      : "#FFFFFF",

                    border: step.featured
                      ? "none"
                      : "1px solid #CBD5E1",

                    color: step.featured
                      ? "#FFFFFF"
                      : "#2563EB",

                    fontFamily:
                      "var(--font-plus-jakarta), sans-serif",

                    fontSize: "13px",
                    fontWeight: 800,

                    boxShadow:
                      step.featured
                        ? "0 8px 20px rgba(37,99,235,0.20)"
                        : "0 2px 6px rgba(15,39,68,0.04)",

                    marginBottom: "22px",
                  }}
                >
                  {step.num}
                </div>

                {/* Content */}
                <div
                  style={{
                    paddingRight: "10px",
                  }}
                >
                  <h3
                    style={{
                      fontFamily:
                        "var(--font-plus-jakarta), sans-serif",

                      fontWeight: 700,

                      fontSize: "17px",

                      color:
                        step.featured
                          ? "#2563EB"
                          : "#0F2744",

                      margin:
                        "0 0 8px",

                      letterSpacing:
                        "-0.3px",
                    }}
                  >
                    {step.title}
                  </h3>

                  <p
                    style={{
                      color: "#64748B",
                      fontSize: "14px",
                      lineHeight: 1.65,
                      margin: 0,
                      fontFamily:
                        "var(--font-inter), sans-serif",
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom statement */}
        <div
          style={{
            marginTop: "76px",
            paddingTop: "30px",
            borderTop:
              "1px solid #E2E8F0",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#475569",
              fontSize: "14px",
              fontFamily:
                "var(--font-inter), sans-serif",
            }}
          >
            <strong
              style={{
                color: "#0F2744",
              }}
            >
              Tú no tienes que buscar todos los días.
            </strong>{" "}
            Nosotros lo hacemos por ti.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) {
          .process-line {
            display: none !important;
          }

          .steps-grid {
            grid-template-columns: 1fr 1fr !important;
            column-gap: 40px !important;
            row-gap: 50px !important;
          }
        }

        @media (max-width: 540px) {
          .steps-grid {
            grid-template-columns: 1fr !important;
            row-gap: 42px !important;
          }
        }
      `}</style>
    </section>
  );
}