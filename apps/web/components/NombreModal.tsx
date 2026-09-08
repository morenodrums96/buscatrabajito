"use client";

import { useState } from "react";

interface Props {
  onComplete: (nombre: string) => void;
}

export default function NombreModal({ onComplete }: Props) {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es requerido."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/nombre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, apellidos }),
      });
      if (res.ok) onComplete(nombre.trim());
      else setError("Algo salió mal, intenta de nuevo.");
    } catch {
      setError("Algo salió mal, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(15,39,68,0.55)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        background: "#FFFFFF", borderRadius: "20px",
        padding: "40px 36px", width: "100%", maxWidth: "440px",
        boxShadow: "0 24px 60px rgba(15,39,68,0.18)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>👋</div>
          <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "22px", color: "#0F2744", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
            ¿Cómo te llamas?
          </h2>
          <p style={{ color: "#64748B", fontSize: "14px", margin: 0, fontFamily: "var(--font-inter), sans-serif" }}>
            Esto nos ayuda a personalizar tu experiencia.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", fontFamily: "var(--font-inter), sans-serif", display: "block", marginBottom: "6px" }}>
              Nombre *
            </label>
            <input
              type="text"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              style={{
                width: "100%", padding: "12px 14px", borderRadius: "9px",
                border: "1.5px solid #E2E8F0", fontSize: "14px", color: "#0F2744",
                fontFamily: "var(--font-inter), sans-serif", outline: "none",
                boxSizing: "border-box", transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#2563EB"}
              onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
            />
          </div>

          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", fontFamily: "var(--font-inter), sans-serif", display: "block", marginBottom: "6px" }}>
              Apellidos
            </label>
            <input
              type="text"
              placeholder="Tus apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: "9px",
                border: "1.5px solid #E2E8F0", fontSize: "14px", color: "#0F2744",
                fontFamily: "var(--font-inter), sans-serif", outline: "none",
                boxSizing: "border-box", transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#2563EB"}
              onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
            />
          </div>

          {error && <p style={{ color: "#EF4444", fontSize: "13px", margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "6px", padding: "13px", background: "#2563EB",
              color: "#FFF", fontWeight: 700, fontSize: "14px", border: "none",
              borderRadius: "9px", cursor: loading ? "default" : "pointer",
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              opacity: loading ? 0.65 : 1, transition: "opacity 0.2s",
            }}
          >
            {loading ? "Guardando..." : "Continuar →"}
          </button>
        </form>
      </div>
    </div>
  );
}
