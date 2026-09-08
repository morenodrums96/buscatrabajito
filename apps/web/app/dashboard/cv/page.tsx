"use client";

import { useState } from "react";
import BusquedaStep from "@/components/BusquedaStep";
interface Experiencia {
  empresa: string;
  puesto: string;
  fechaInicio: string;
  fechaFin: string;
  descripcion: string;
}

interface Educacion {
  institucion: string;
  carrera: string;
  anio: string;
}

interface Idioma {
  idioma: string;
  nivel: string;
}

interface CVData {
  nombreCompleto: string;
  email: string;
  telefono: string;
  ciudad: string;
  linkedin: string;
  tituloProfesional: string;
  habilidades: string[];
  idiomas: Idioma[];
  experiencia: Experiencia[];
  educacion: Educacion[];
  tieneExperiencia: boolean;
}

type Step = "inicio" | "extrayendo" | "confirmar" | "busqueda" | "listo";

export default function MiCV() {
  const [step, setStep] = useState<Step>("inicio");
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [error, setError] = useState("");
  const [newSkill, setNewSkill] = useState("");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { setError("Solo se aceptan archivos PDF."); return; }

    setStep("extrayendo");
    setError("");

    const formData = new FormData();
    formData.append("cv", file);

    try {
      const res = await fetch("/api/cv/extraer", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) { setError(data.error); setStep("inicio"); return; }
      setCvData(data);
      setStep("confirmar");
    } catch {
      setError("Algo salió mal. Intenta de nuevo.");
      setStep("inicio");
    }
  }

  function updateField(field: keyof CVData, value: string) {
    setCvData((d) => d ? { ...d, [field]: value } : d);
  }

  function addSkill() {
    if (!newSkill.trim()) return;
    setCvData((d) => d ? { ...d, habilidades: [...d.habilidades, newSkill.trim()] } : d);
    setNewSkill("");
  }

  function removeSkill(i: number) {
    setCvData((d) => d ? { ...d, habilidades: d.habilidades.filter((_, idx) => idx !== i) } : d);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "var(--font-inter), sans-serif" }}>

      {/* TOPBAR */}
      <header style={{ background: "#0F2744", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}>
        <a href="/" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "20px", textDecoration: "none", color: "#FFFFFF" }}>
          Busco<span style={{ color: "#60A5FA" }}>Trabajito</span>
        </a>
        <a href="/dashboard" style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", textDecoration: "none" }}>← Volver al dashboard</a>
      </header>

      <div style={{ display: "flex", paddingTop: "64px" }}>

        {/* SIDEBAR */}
        <aside style={{ width: "220px", background: "#FFFFFF", borderRight: "1px solid #E2E8F0", position: "fixed", top: "64px", left: 0, bottom: 0 }}>
          <nav style={{ padding: "20px 12px" }}>
            {[
              { icon: "🏠", label: "Inicio", href: "/dashboard" },
              { icon: "📄", label: "Mi CV", href: "/dashboard/cv", active: true },
              { icon: "🔍", label: "Vacantes", href: "/dashboard/vacantes" },
              { icon: "⚙️", label: "Configuración", href: "/dashboard/configuracion" },
            ].map((item) => (
              <a key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", borderRadius: "9px", marginBottom: "4px",
                textDecoration: "none", fontSize: "14px",
                fontWeight: item.active ? 700 : 500,
                color: item.active ? "#2563EB" : "#475569",
                background: item.active ? "#EFF6FF" : "transparent",
              }}>
                <span>{item.icon}</span>{item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* CONTENIDO */}
        <main style={{ marginLeft: "220px", flex: 1, padding: "32px 28px", maxWidth: "800px" }}>

          <div style={{ marginBottom: "28px" }}>
            <h1 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "24px", color: "#0F2744", margin: "0 0 4px" }}>
              Mi CV
            </h1>
            <p style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>
              Tu información personal que usamos para buscar vacantes y generar tu CV profesional.
            </p>
          </div>

          {/* PASO: INICIO */}
          {step === "inicio" && (
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "40px", textAlign: "center", boxShadow: "0 2px 8px rgba(15,39,68,0.04)" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
              <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "20px", color: "#0F2744", margin: "0 0 8px" }}>
                ¿Tienes un CV?
              </h2>
              <p style={{ color: "#64748B", fontSize: "14px", maxWidth: "400px", margin: "0 auto 28px", lineHeight: 1.6 }}>
                Sube tu CV en PDF y nuestra IA extrae toda la información automáticamente. Solo tendrás que confirmar que los datos sean correctos.
              </p>

              {error && <p style={{ color: "#EF4444", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                <label style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "13px 28px", background: "#2563EB", color: "#FFF",
                  borderRadius: "10px", cursor: "pointer", fontWeight: 700,
                  fontSize: "14px", fontFamily: "var(--font-plus-jakarta), sans-serif",
                }}>
                  📎 Subir mi CV en PDF
                  <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: "none" }} />
                </label>

                <button
                  onClick={() => setStep("confirmar")}
                  style={{ background: "transparent", border: "none", color: "#64748B", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}
                >
                  No tengo CV — llenar manualmente
                </button>
              </div>
            </div>
          )}

          {/* PASO: EXTRAYENDO */}
          {step === "extrayendo" && (
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "60px 40px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px", animation: "spin 2s linear infinite", display: "inline-block" }}>⚙️</div>
              <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "20px", color: "#0F2744", margin: "0 0 8px" }}>
                Analizando tu CV...
              </h2>
              <p style={{ color: "#64748B", fontSize: "14px" }}>
                Nuestra IA está extrayendo tu información. Esto tarda unos segundos.
              </p>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* PASO: CONFIRMAR */}
          {step === "confirmar" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Info personal */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(15,39,68,0.04)" }}>
                <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 700, fontSize: "16px", color: "#0F2744", margin: "0 0 20px" }}>
                  Información personal
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  {[
                    { label: "Nombre completo", field: "nombreCompleto" as keyof CVData },
                    { label: "Correo", field: "email" as keyof CVData },
                    { label: "Teléfono", field: "telefono" as keyof CVData },
                    { label: "Ciudad", field: "ciudad" as keyof CVData },
                    { label: "LinkedIn", field: "linkedin" as keyof CVData },
                    { label: "Título / Área profesional", field: "tituloProfesional" as keyof CVData },
                  ].map((f) => (
                    <div key={f.field}>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>{f.label}</label>
                      <input
                        type="text"
                        value={cvData?.[f.field] as string ?? ""}
                        onChange={(e) => updateField(f.field, e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: "8px", fontSize: "13px", color: "#0F2744", outline: "none", boxSizing: "border-box" }}
                        onFocus={(e) => e.target.style.borderColor = "#2563EB"}
                        onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Habilidades */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(15,39,68,0.04)" }}>
                <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 700, fontSize: "16px", color: "#0F2744", margin: "0 0 16px" }}>
                  Habilidades
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
                  {cvData?.habilidades.map((skill, i) => (
                    <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#EFF6FF", color: "#2563EB", padding: "5px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600 }}>
                      {skill}
                      <button onClick={() => removeSkill(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563EB", fontSize: "14px", lineHeight: 1, padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Agregar habilidad"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    style={{ flex: 1, padding: "9px 12px", border: "1.5px solid #E2E8F0", borderRadius: "8px", fontSize: "13px", outline: "none" }}
                  />
                  <button onClick={addSkill} style={{ padding: "9px 16px", background: "#2563EB", color: "#FFF", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>
                    Agregar
                  </button>
                </div>
              </div>

              {/* Experiencia */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(15,39,68,0.04)" }}>
                <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 700, fontSize: "16px", color: "#0F2744", margin: "0 0 16px" }}>
                  Experiencia laboral
                </h2>
                {cvData?.experiencia.length === 0 || !cvData?.tieneExperiencia ? (
                  <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: "10px", padding: "16px" }}>
                    <p style={{ color: "#92400E", fontSize: "13px", margin: "0 0 4px", fontWeight: 600 }}>Sin experiencia laboral detectada</p>
                    <p style={{ color: "#B45309", fontSize: "12px", margin: 0 }}>No te preocupes — usaremos tus estudios y proyectos para construir tu CV.</p>
                  </div>
                ) : (
                  cvData?.experiencia.map((exp, i) => (
                    <div key={i} style={{ padding: "14px", background: "#F8FAFC", borderRadius: "10px", marginBottom: "10px", border: "1px solid #E2E8F0" }}>
                      <p style={{ fontWeight: 700, fontSize: "14px", color: "#0F2744", margin: "0 0 2px" }}>{exp.puesto}</p>
                      <p style={{ fontSize: "13px", color: "#2563EB", margin: "0 0 2px" }}>{exp.empresa}</p>
                      <p style={{ fontSize: "12px", color: "#64748B", margin: "0 0 6px" }}>{exp.fechaInicio} — {exp.fechaFin}</p>
                      <p style={{ fontSize: "12px", color: "#475569", margin: 0, lineHeight: 1.5 }}>{exp.descripcion}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Educación */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(15,39,68,0.04)" }}>
                <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 700, fontSize: "16px", color: "#0F2744", margin: "0 0 16px" }}>
                  Educación
                </h2>
                {cvData?.educacion.map((edu, i) => (
                  <div key={i} style={{ padding: "14px", background: "#F8FAFC", borderRadius: "10px", marginBottom: "10px", border: "1px solid #E2E8F0" }}>
                    <p style={{ fontWeight: 700, fontSize: "14px", color: "#0F2744", margin: "0 0 2px" }}>{edu.carrera}</p>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 2px" }}>{edu.institucion}</p>
                    <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>{edu.anio}</p>
                  </div>
                ))}
              </div>

              {/* Botón continuar */}
              <button
                onClick={() => setStep("busqueda")}
                style={{ padding: "14px", background: "#2563EB", color: "#FFF", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 700, fontSize: "15px", fontFamily: "var(--font-plus-jakarta), sans-serif" }}
              >
                Confirmar información → Definir búsquedas
              </button>
            </div>
          )}

          {/* PASO: BUSQUEDA */}
          {step === "busqueda" && (
            <BusquedaStep cvData={cvData as Record<string, unknown> | null} onFinish={() => setStep("listo")} />)}

          {/* PASO: LISTO */}
          {step === "listo" && (
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "48px", textAlign: "center", boxShadow: "0 2px 8px rgba(15,39,68,0.04)" }}>
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
              <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "22px", color: "#0F2744", margin: "0 0 8px" }}>
                ¡Todo listo!
              </h2>
              <p style={{ color: "#64748B", fontSize: "14px", maxWidth: "360px", margin: "0 auto 24px" }}>
                Tu perfil está configurado. Empezamos a buscar vacantes para ti ahora mismo.
              </p>
              <a href="/dashboard" style={{ display: "inline-block", padding: "13px 28px", background: "#2563EB", color: "#FFF", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "14px", fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
                Ir al dashboard →
              </a>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
