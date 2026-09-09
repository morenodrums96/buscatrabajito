"use client";

import { usePathname } from "next/navigation";
import { User, ChevronRight, Sparkles } from "lucide-react";

interface DashboardHeaderProps {
  displayName: string;
  planLabel: string;
}

const MAPA_RUTAS: Record<string, string> = {
  "/dashboard": "Resumen General",
  "/dashboard/cv": "Mi CV y Preferencias",
  "/dashboard/vacantes": "Vacantes Detectadas",
  "/dashboard/ajustes": "Ajustes de Cuenta",
};

export default function DashboardHeader({
  displayName,
  planLabel,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const rutaActual = MAPA_RUTAS[pathname] ?? "Panel";

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-8 ml-64 sticky top-0 z-40 transition-all">
      {/* Dynamic Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span className="text-slate-400">Dashboard</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-[#0F2744] font-bold">{rutaActual}</span>
      </div>

      {/* Info Usuario & Badge de Plan */}
      <div className="flex items-center gap-4">
        {/* Badge del Plan */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
          {planLabel === "GRATUITO" ? (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          ) : (
            <Sparkles className="w-3 h-3 text-[#2563EB]" />
          )}
          {planLabel}
        </div>

        {/* Info del Perfil */}
        <div className="flex items-center gap-2.5 text-slate-700 text-xs font-semibold pl-2 border-l border-slate-200">
          <div className="w-8 h-8 bg-blue-50 text-[#2563EB] rounded-full flex items-center justify-center border border-blue-100 font-bold shadow-2xs">
            {displayName ? (
              displayName.charAt(0).toUpperCase()
            ) : (
              <User className="w-4 h-4 text-slate-600" />
            )}
          </div>
          <span className="truncate max-w-[160px] text-[#0F2744]">
            {displayName || "Cargando..."}
          </span>
        </div>
      </div>
    </header>
  );
}