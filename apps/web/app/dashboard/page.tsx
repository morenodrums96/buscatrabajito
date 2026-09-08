"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import NombreModal from "@/components/NombreModal";

interface Profile {
  puesto?: string;
  nivel?: string;
  ubicacion?: string;
  modalidad?: string;
  whatsapp?: string;
  plan: string;
  createdAt: string;
  nombreCompleto?: string;
  apellidos?: string;
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:      { label: "Gratis",    color: "#64748B" },
  buscador:  { label: "Buscador",  color: "#2563EB" },
  aplicador: { label: "Aplicador", color: "#7C3AED" },
};

const NAV_ITEMS = [
  { icon: "🏠", label: "Inicio",         href: "/dashboard" },
  { icon: "📄", label: "Mi CV",          href: "/dashboard/cv" },
  { icon: "🔍", label: "Vacantes",       href: "/dashboard/vacantes" },
  { icon: "⚙️", label: "Configuración",  href: "/dashboard/configuracion" },
];

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/sign-in"); return; }

    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        if (data?.nombreCompleto) {
          setDisplayName(data.nombreCompleto);
        } else {
          setShowModal(true);
          setDisplayName(user.emailAddresses[0]?.emailAddress ?? "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isLoaded, user, router]);

  function handleNombreComplete(nombre: string) {
    setDisplayName(nombre);
    setShowModal(false);
  }

  if (!isLoaded || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#64748B", fontFamily: "var(--font-inter), sans-serif" }}>Cargando...</p>
      </div>
    );
  }

  const plan = profile?.plan ?? "free";
  const planInfo = PLAN_LABELS[plan] ?? PLAN_LABELS.free;
  const diasActivo = profile ? Math.max(1, Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / 86400000)) : 1;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column", fontFamily: "var(--font-inter), sans-serif" }}>

      {showModal && <NombreModal onComplete={handleNombreComplete} />}

      {/* ── TOPBAR ── */}
      <header style={{ background: "#0F2744", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}>
        <a href="/" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "20px", textDecoration: "none", color: "#FFFFFF" }}>
          Busco<span style={{ color: "#60A5FA" }}>Trabajito</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{ background: planInfo.color, color: "#FFF", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "999px" }}>
            {planInfo.label.toUpperCase()}
          </span>
          <span style={{ color: "rgba(255,255,255,0.80)", fontSize: "13px", fontWeight: 500 }}>
            {displayName}
          </span>
          <button
            onClick={() => signOut(() => router.push("/"))}
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)", fontSize: "12px", padding: "7px 14px", borderRadius: "7px", cursor: "pointer" }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div style={{ display: "flex", paddingTop: "64px", minHeight: "calc(100vh - 64px)" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width: "220px", background: "#FFFFFF", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", position: "fixed", top: "64px", left: 0, bottom: 0, overflowY: "auto" }}>
          <nav style={{ flex: 1, padding: "20px 12px" }}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <a key={item.href} href={item.href} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 12px", borderRadius: "9px", marginBottom: "4px",
                  textDecoration: "none", fontSize: "14px", fontWeight: active ? 700 : 500,
                  color: active ? "#2563EB" : "#475569",
                  background: active ? "#EFF6FF" : "transparent",
                  transition: "background 0.15s, color 0.15s",
                }}>
                  <span style={{ fontSize: "16px" }}>{item.icon}</span>
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Bottom del sidebar */}
          <div style={{ padding: "12px", borderTop: "1px solid #E2E8F0" }}>
            {plan === "free" && (
              <a href="/#precios" style={{
                display: "block", textAlign: "center", padding: "10px",
                background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                color: "#FFF", borderRadius: "9px", textDecoration: "none",
                fontSize: "12px", fontWeight: 700, marginBottom: "8px",
                fontFamily: "var(--font-plus-jakarta), sans-serif",
              }}>
                💎 Mejorar plan
              </a>
            )}
            <button
              onClick={() => signOut(() => router.push("/"))}
              style={{
                width: "100%", padding: "9px", background: "transparent",
                border: "1px solid #E2E8F0", color: "#94A3B8", fontSize: "13px",
                borderRadius: "8px", cursor: "pointer", fontFamily: "var(--font-inter), sans-serif",
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* ── CONTENIDO PRINCIPAL ── */}
        <main style={{ marginLeft: "220px", flex: 1, padding: "32px 28px" }}>

          {/* Bienvenida */}
          <div style={{ marginBottom: "24px" }}>
            <h1 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "24px", color: "#0F2744", margin: "0 0 4px", letterSpacing: "-0.5px" }}>
              Hola, {profile?.nombreCompleto ?? displayName} 👋
            </h1>
            <p style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>
              Tu búsqueda está activa — revisamos nuevas vacantes cada 30 minutos.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
            {[
              { label: "Vacantes encontradas", value: "—", icon: "🔍", sub: "esta semana" },
              { label: "Alertas enviadas",      value: "—", icon: "🔔", sub: "este mes" },
              { label: "CV generados",          value: "—", icon: "📄", sub: "en total" },
              { label: "Días activo",           value: diasActivo, icon: "📅", sub: "buscando" },
            ].map((stat) => (
              <div key={stat.label} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "18px", boxShadow: "0 2px 8px rgba(15,39,68,0.04)" }}>
                <div style={{ fontSize: "22px", marginBottom: "8px" }}>{stat.icon}</div>
                <div style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "26px", color: "#0F2744", lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>{stat.label}</div>
                <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Perfil + Notificaciones */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "18px" }}>

            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "22px", boxShadow: "0 2px 8px rgba(15,39,68,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 700, fontSize: "15px", color: "#0F2744", margin: 0 }}>Mi perfil de búsqueda</h2>
                <a href="/onboarding" style={{ fontSize: "12px", color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>Editar</a>
              </div>
              {profile?.puesto ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {[
                    { label: "Puesto",    value: profile.puesto },
                    { label: "Nivel",     value: profile.nivel },
                    { label: "Ubicación", value: profile.ubicacion },
                    { label: "Modalidad", value: profile.modalidad },
                  ].map((row) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #F1F5F9" }}>
                      <span style={{ fontSize: "13px", color: "#64748B" }}>{row.label}</span>
                      <span style={{ fontSize: "13px", color: "#0F2744", fontWeight: 600 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <p style={{ color: "#64748B", fontSize: "13px", marginBottom: "12px" }}>No tienes perfil configurado.</p>
                  <a href="/onboarding" style={{ background: "#2563EB", color: "#FFF", padding: "9px 18px", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: 700 }}>Configurar →</a>
                </div>
              )}
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "22px", boxShadow: "0 2px 8px rgba(15,39,68,0.04)" }}>
              <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 700, fontSize: "15px", color: "#0F2744", margin: "0 0 18px" }}>Notificaciones</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { icon: "✉️", label: "Correo electrónico", value: user?.emailAddresses[0]?.emailAddress, activo: true },
                  { icon: "💬", label: "WhatsApp", value: profile?.whatsapp ?? "No configurado", activo: plan !== "free" },
                ].map((n) => (
                  <div key={n.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "18px" }}>{n.icon}</span>
                      <div>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#0F2744" }}>{n.label}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>{n.value}</p>
                      </div>
                    </div>
                    <span style={{ background: n.activo ? "#DCFCE7" : "#F1F5F9", color: n.activo ? "#16A34A" : "#94A3B8", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "999px" }}>
                      {n.activo ? "Activo" : "Plan de pago"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vacantes */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "22px", marginBottom: "18px", boxShadow: "0 2px 8px rgba(15,39,68,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 700, fontSize: "15px", color: "#0F2744", margin: 0 }}>Vacantes encontradas para ti</h2>
              <a href="/dashboard/vacantes" style={{ fontSize: "12px", color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>Ver todas →</a>
            </div>
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>🔍</div>
              <p style={{ fontWeight: 600, color: "#0F2744", fontSize: "14px", margin: "0 0 4px" }}>Buscando vacantes para ti...</p>
              <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>Las primeras alertas llegan en la próxima búsqueda automática (cada 30 min).</p>
            </div>
          </div>

          {/* Banner upgrade */}
          {plan === "free" && (
            <div style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)", borderRadius: "16px", padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <p style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "16px", color: "#FFF", margin: "0 0 4px" }}>
                  ¿Quieres más vacantes y alertas por WhatsApp?
                </p>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: 0 }}>
                  El plan Buscador incluye 7 portales, WhatsApp y ajuste de CV por vacante.
                </p>
              </div>
              <a href="/#precios" style={{ background: "#FFF", color: "#2563EB", padding: "10px 20px", borderRadius: "9px", textDecoration: "none", fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-plus-jakarta), sans-serif", whiteSpace: "nowrap" }}>
                Ver planes →
              </a>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
