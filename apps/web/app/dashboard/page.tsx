"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";

interface Profile {
  puesto: string;
  nivel: string;
  ubicacion: string;
  modalidad: string;
  whatsapp?: string;
  plan: string;
  createdAt: string;
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:      { label: "Gratis",    color: "#64748B" },
  buscador:  { label: "Buscador",  color: "#2563EB" },
  aplicador: { label: "Aplicador", color: "#7C3AED" },
};

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/sign-in"); return; }

    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isLoaded, user, router]);

  if (!isLoaded || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#64748B", fontFamily: "var(--font-inter), sans-serif" }}>Cargando...</p>
      </div>
    );
  }

  const plan = profile?.plan ?? "free";
  const planInfo = PLAN_LABELS[plan] ?? PLAN_LABELS.free;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "var(--font-inter), sans-serif" }}>

      {/* ── TOPBAR ── */}
      <header style={{ background: "#0F2744", padding: "0 32px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "20px", textDecoration: "none", color: "#FFFFFF" }}>
          Busco<span style={{ color: "#60A5FA" }}>Trabajito</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ background: planInfo.color, color: "#FFF", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "999px", letterSpacing: "0.5px" }}>
            {planInfo.label.toUpperCase()}
          </span>
          <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px" }}>
{user?.firstName ?? user?.emailAddresses[0]?.emailAddress?.split("@")[0] ?? "bienvenido"}
          </span>
          <button
            onClick={() => signOut(() => router.push("/"))}
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)", fontSize: "12px", padding: "7px 14px", borderRadius: "7px", cursor: "pointer" }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "36px 24px" }}>

        {/* ── BIENVENIDA ── */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "26px", color: "#0F2744", margin: "0 0 4px", letterSpacing: "-0.5px" }}>
            Hola, {user?.firstName ?? "bienvenido"} 👋
          </h1>
          <p style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>
            Tu búsqueda está activa — revisamos nuevas vacantes cada 30 minutos.
          </p>
        </div>

        {/* ── STATS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          {[
            { label: "Vacantes encontradas", value: "—", icon: "🔍", sub: "esta semana" },
            { label: "Alertas enviadas",      value: "—", icon: "🔔", sub: "este mes" },
            { label: "CV generados",          value: "—", icon: "📄", sub: "en total" },
            { label: "Días activo",           value: profile ? Math.max(1, Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / 86400000)) : "—", icon: "📅", sub: "buscando" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(15,39,68,0.04)" }}>
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>{stat.icon}</div>
              <div style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "28px", color: "#0F2744", lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>{stat.label}</div>
              <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>

          {/* ── PERFIL DE BÚSQUEDA ── */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(15,39,68,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 700, fontSize: "16px", color: "#0F2744", margin: 0 }}>
                Mi perfil de búsqueda
              </h2>
              <a href="/onboarding" style={{ fontSize: "12px", color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>Editar</a>
            </div>
            {profile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { label: "Puesto",     value: profile.puesto },
                  { label: "Nivel",      value: profile.nivel },
                  { label: "Ubicación",  value: profile.ubicacion },
                  { label: "Modalidad",  value: profile.modalidad },
                  { label: "WhatsApp",   value: profile.whatsapp ?? "No configurado" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
                    <span style={{ fontSize: "13px", color: "#64748B" }}>{row.label}</span>
                    <span style={{ fontSize: "13px", color: "#0F2744", fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ color: "#64748B", fontSize: "14px", marginBottom: "12px" }}>No tienes perfil configurado.</p>
                <a href="/onboarding" style={{ background: "#2563EB", color: "#FFF", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: 700 }}>
                  Configurar perfil →
                </a>
              </div>
            )}
          </div>

          {/* ── NOTIFICACIONES ── */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(15,39,68,0.04)" }}>
            <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 700, fontSize: "16px", color: "#0F2744", margin: "0 0 20px" }}>
              Notificaciones
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>✉️</span>
                  <div>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#0F2744" }}>Correo electrónico</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>{user?.emailAddresses[0]?.emailAddress}</p>
                  </div>
                </div>
                <span style={{ background: "#DCFCE7", color: "#16A34A", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "999px" }}>Activo</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>💬</span>
                  <div>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#0F2744" }}>WhatsApp</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>{profile?.whatsapp ?? "No configurado"}</p>
                  </div>
                </div>
                {plan === "free" ? (
                  <span style={{ background: "#F1F5F9", color: "#94A3B8", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "999px" }}>Plan de pago</span>
                ) : (
                  <span style={{ background: "#DCFCE7", color: "#16A34A", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "999px" }}>Activo</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── VACANTES ── */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "24px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(15,39,68,0.04)" }}>
          <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 700, fontSize: "16px", color: "#0F2744", margin: "0 0 20px" }}>
            Vacantes encontradas para ti
          </h2>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
            <p style={{ fontWeight: 600, color: "#0F2744", fontSize: "15px", margin: "0 0 6px" }}>Buscando vacantes para ti...</p>
            <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
              Las primeras alertas llegan en la próxima búsqueda automática (cada 30 min).
            </p>
          </div>
        </div>

        {/* ── CV ── */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "24px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(15,39,68,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 700, fontSize: "16px", color: "#0F2744", margin: 0 }}>
              Mi CV
            </h2>
          </div>
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📄</div>
            <p style={{ fontWeight: 600, color: "#0F2744", fontSize: "15px", margin: "0 0 6px" }}>Aún no tienes un CV generado</p>
            <p style={{ color: "#64748B", fontSize: "13px", margin: "0 0 20px" }}>
              Responde unas preguntas simples y nuestra IA genera tu CV profesional.
            </p>
            <a href="/cv" style={{ background: "#2563EB", color: "#FFF", padding: "11px 24px", borderRadius: "9px", textDecoration: "none", fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
              Generar mi CV con IA →
            </a>
          </div>
        </div>

        {/* ── BANNER UPGRADE (solo free) ── */}
        {plan === "free" && (
          <div style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)", borderRadius: "16px", padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <p style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "17px", color: "#FFF", margin: "0 0 4px" }}>
                ¿Quieres más vacantes y alertas por WhatsApp?
              </p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: 0 }}>
                El plan Buscador incluye 7 portales, WhatsApp y ajuste de CV por vacante.
              </p>
            </div>
            <a href="/#precios" style={{ background: "#FFF", color: "#2563EB", padding: "11px 22px", borderRadius: "9px", textDecoration: "none", fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-plus-jakarta), sans-serif", whiteSpace: "nowrap" }}>
              Ver planes →
            </a>
          </div>
        )}

      </main>
    </div>
  );
}
