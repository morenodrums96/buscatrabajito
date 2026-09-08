"use client";

import { useEffect, useState } from "react";

interface Perfil {
  puesto: string;
  ubicacion: string;
  modalidad: string;
  activo: boolean;
}

const MODALIDADES = ["Presencial", "Remoto", "Híbrido", "Cualquiera"];

interface Props {
  cvData: Record<string, unknown> | null;
  onFinish: () => void;
}

export default function BusquedaStep({ cvData, onFinish }: Props) {
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nuevoPuesto, setNuevoPuesto] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/cv/sugerir-puestos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvData }),
    })
      .then((r) => r.json())
      .then((data) => {
        const sugeridos = (data.puestos ?? []).map((p: string) => ({
          puesto: p,
          ubicacion: "Monterrey, NL",
          modalidad: "Cualquiera",
          activo: true,
        }));
        setPerfiles(sugeridos);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, [cvData]);

  function toggleActivo(i: number) {
    setPerfiles((ps) => ps.map((p, idx) => idx === i ? { ...p, activo: !p.activo } : p));
  }

  function updatePerfil(i: number, field: keyof Perfil, value: string) {
    setPerfiles((ps) => ps.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }

  function agregarPuesto() {
    if (!nuevoPuesto.trim()) return;
    setPerfiles((ps) => [...ps, {
      puesto: nuevoPuesto.trim(),
      ubicacion: "Monterrey, NL",
      modalidad: "Cualquiera",
      activo: true,
    }]);
    setNuevoPuesto("");
  }

  async function handleGuardar() {
    setSaving(true);
    const activos = perfiles.filter((p) => p.activo);
    await fetch("/api/cv/guardar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvData, perfiles: activos }),
    });
    setSaving(false);
    onFinish();
  }

  if (cargando) {
    return (
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "60px 40px", textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🤖</div>
        <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "18px", color: "#0F2744", margin: "0 0 8px" }}>
          Analizando tu perfil...
        </h2>
        <p style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>
          La IA está identificando los puestos ideales para ti.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(15,39,68,0.04)" }}>
        <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "20px", color: "#0F2744", margin: "0 0 6px" }}>
          ¿Qué trabajo buscas?
        </h2>
        <p style={{ color: "#64748B", fontSize: "14px", margin: "0 0 24px" }}>
          Basándonos en tu CV, te sugerimos estos puestos. Activa los que te interesan, ajusta ubicación y modalidad, o agrega los tuyos.
        </p>

        {/* Sugerencias */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          {perfiles.map((perfil, i) => (
            <div key={i} style={{
              border: `1.5px solid ${perfil.activo ? "#2563EB" : "#E2E8F0"}`,
              borderRadius: "12px", padding: "16px",
              background: perfil.activo ? "#F0F6FF" : "#FAFAFA",
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: perfil.activo ? "14px" : "0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button
                    onClick={() => toggleActivo(i)}
                    style={{
                      width: "22px", height: "22px", borderRadius: "6px",
                      border: `2px solid ${perfil.activo ? "#2563EB" : "#CBD5E1"}`,
                      background: perfil.activo ? "#2563EB" : "#FFF",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {perfil.activo && <svg viewBox="0 0 12 12" width="10" height="10" fill="none"><path d="M2 6l2.5 2.5L10 3.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </button>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: perfil.activo ? "#0F2744" : "#94A3B8" }}>
                    {perfil.puesto}
                  </span>
                </div>
                {!perfil.activo && <span style={{ fontSize: "11px", color: "#94A3B8" }}>Desactivado</span>}
              </div>

              {perfil.activo && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", paddingLeft: "34px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "4px" }}>Ubicación</label>
                    <input
                      type="text"
                      value={perfil.ubicacion}
                      onChange={(e) => updatePerfil(i, "ubicacion", e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: "7px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                      onFocus={(e) => e.target.style.borderColor = "#2563EB"}
                      onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "4px" }}>Modalidad</label>
                    <select
                      value={perfil.modalidad}
                      onChange={(e) => updatePerfil(i, "modalidad", e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: "7px", fontSize: "13px", outline: "none", background: "#FFF", boxSizing: "border-box" }}
                    >
                      {MODALIDADES.map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Agregar puesto manual */}
        <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#374151", margin: "0 0 10px" }}>
            ¿Quieres agregar otro puesto?
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="Ej: Project Manager, Scrum Master..."
              value={nuevoPuesto}
              onChange={(e) => setNuevoPuesto(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && agregarPuesto()}
              style={{ flex: 1, padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: "8px", fontSize: "13px", outline: "none" }}
              onFocus={(e) => e.target.style.borderColor = "#2563EB"}
              onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
            />
            <button
              onClick={agregarPuesto}
              style={{ padding: "10px 18px", background: "#0F2744", color: "#FFF", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}
            >
              + Agregar
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleGuardar}
        disabled={saving || perfiles.filter(p => p.activo).length === 0}
        style={{
          padding: "14px", background: "#2563EB", color: "#FFF", border: "none",
          borderRadius: "10px", cursor: saving ? "default" : "pointer",
          fontWeight: 700, fontSize: "15px", opacity: saving ? 0.65 : 1,
          fontFamily: "var(--font-plus-jakarta), sans-serif",
        }}
      >
        {saving ? "Guardando..." : `Activar ${perfiles.filter(p => p.activo).length} búsqueda(s) →`}
      </button>
    </div>
  );
}
