"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Search,
  Bell,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardContext";

interface Perfil {
  puesto: string;
  estados: string[];
  modalidades: string[];
}

export default function Dashboard() {
  const { user } = useUser();
  const { profile, displayName, plan } = useDashboard();
  const [diasActivo] = useState(() =>
    profile?.createdAt
      ? Math.max(
          1,
          Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / 86400000)
        )
      : 1
  );
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [loadingPerfiles, setLoadingPerfiles] = useState(true);

  useEffect(() => {
    fetch("/api/perfiles")
      .then((r) => r.json())
      .then((data) => {
        setPerfiles(Array.isArray(data) ? data : []);
        setLoadingPerfiles(false);
      })
      .catch(() => setLoadingPerfiles(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Banner de Saludo */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-extrabold text-[#0F2744] tracking-tight"
            style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
          >
            Bienvenido, {profile?.nombreCompleto ?? displayName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Última actualización de vacantes: Hace unos momentos
          </p>
        </div>
      </div>

      {/* ── BANNER DE AUTOAYUDA / GUIADO INICIAL ── */}
      {!loadingPerfiles && perfiles.length === 0 && (
        <div className="bg-gradient-to-r from-blue-900 via-[#0F2744] to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden transition-all duration-500">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-[11px] font-bold text-blue-300">
                <Sparkles className="w-3 h-3 text-blue-400" /> Siguiente paso recomendado
              </div>
              <h3
                className="text-base font-bold text-white tracking-tight"
                style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
              >
                Configura tus Preferencias de Búsqueda
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ya guardaste tu CV base. Ahora define los puestos, estados y modalidades requeridas para activar el rastreador de vacantes en tiempo real.
              </p>
            </div>

            <Link
              href="/dashboard/cv"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex-shrink-0 active:scale-95"
            >
              Ir a Configurar Mi CV <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Vacantes encontradas", value: "0", sub: "esta semana", icon: Search },
          { label: "Alertas enviadas", value: "0", sub: "este mes", icon: Bell },
          { label: "CV generados", value: "0", sub: "en total", icon: FileText },
          { label: "Días activo", value: diasActivo, sub: "en la plataforma", icon: Calendar },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold text-slate-500">{m.label}</span>
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
              <div
                className="text-2xl font-extrabold text-[#0F2744] tracking-tight"
                style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
              >
                {m.value}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{m.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Perfil & Notificaciones en Paneles Divididos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel Perfil / Búsquedas */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider">
              Búsquedas activas
            </h2>
            <Link href="/dashboard/cv" className="text-xs text-[#2563EB] hover:underline font-bold">
              Editar →
            </Link>
          </div>
          {perfiles.length > 0 ? (
            <div className="space-y-2">
              {perfiles.slice(0, 4).map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm font-semibold text-[#0F2744]">{p.puesto}</span>
                  <span className="text-xs text-slate-500">
                    {p.estados?.length > 2 ? `${p.estados.slice(0, 2).join(", ")} +${p.estados.length - 2}` : p.estados?.join(", ")}
                  </span>
                </div>
              ))}
              {perfiles.length > 4 && (
                <p className="text-xs text-slate-400 pt-1">+{perfiles.length - 4} búsquedas más</p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
              <p className="text-xs text-slate-500 mb-3">Aún no has activado criterios de búsqueda.</p>
              <Link href="/dashboard/cv" className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
                <Zap className="w-3.5 h-3.5" /> Configurar en Mi CV
              </Link>
            </div>
          )}
        </div>

        {/* Panel Notificaciones */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider">
              Canales de notificación
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/60 rounded-lg text-xs">
              <div>
                <p className="font-bold text-[#0F2744]">Correo electrónico</p>
                <p className="text-slate-500 text-[11px]">{user?.emailAddresses[0]?.emailAddress}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" /> Activo
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/60 rounded-lg text-xs">
              <div>
                <p className="font-bold text-[#0F2744]">WhatsApp</p>
                <p className="text-slate-500 text-[11px]">{profile?.whatsapp ?? "No configurado"}</p>
              </div>
              {plan !== "free" ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3" /> Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                  <AlertCircle className="w-3 h-3" /> Plan de pago
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feed de Vacantes */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider">
            Últimas vacantes detectadas
          </h2>
          <Link href="/dashboard/vacantes" className="text-xs text-[#2563EB] hover:underline font-bold">
            Ver todas →
          </Link>
        </div>
        <div className="text-center py-12 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
          <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-[#0F2744] text-xs mb-1">
            Escaneando fuentes de empleo...
          </p>
          <p className="text-slate-400 text-[11px]">
            Recibirás notificaciones automáticas tan pronto como haya coincidencias con tu perfil.
          </p>
        </div>
      </div>
    </div>
  );
}