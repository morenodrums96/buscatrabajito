"use client";

import Link from "next/link";
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Settings, 
  Sparkles, 
  LogOut,
  Zap,
  Briefcase
} from "lucide-react";

interface DashboardSidebarProps {
  pathname: string;
  isFreePlan: boolean;
  onSignOut: () => void;
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Resumen", href: "/dashboard", tour: "sidebar-resumen" },
  { icon: FileText, label: "Mi CV", href: "/dashboard/cv", tour: "sidebar-cv" },
  { icon: Search, label: "Vacantes", href: "/dashboard/vacantes", tour: "sidebar-vacantes" },
  { icon: Settings, label: "Configuración", href: "/dashboard/configuracion", tour: "sidebar-configuracion" },
];

export default function DashboardSidebar({
  pathname,
  isFreePlan,
  onSignOut,
}: DashboardSidebarProps) {
  return (
    <aside className="w-64 bg-[#0B192C] text-white flex flex-col fixed top-0 left-0 bottom-0 z-40 border-r border-slate-800 select-none">
      {/* ── HEADER DEL BRAND ── */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
        <Link
          href="/"
          className="group flex items-center gap-3 transition-all duration-300"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E40AF] via-[#2563EB] to-[#60A5FA] p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 group-hover:shadow-blue-500/30 transition-all duration-300">
            <div className="w-full h-full bg-[#0B192C]/40 rounded-[10px] flex items-center justify-center backdrop-blur-xs">
              <Briefcase className="w-4 h-4 text-white transition-transform group-hover:rotate-6" />
            </div>
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-200 rounded-full blur-[1px]" />
          </div>

          <span
            className="font-extrabold text-lg tracking-tight text-white transition-transform duration-300 group-hover:translate-x-0.5 inline-block"
            style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
          >
            Busco
            <span className="text-[#60A5FA] inline-block transition-all duration-300 group-hover:text-blue-300 group-hover:scale-105 origin-left ml-0.5">
              Trabajito
            </span>
          </span>
        </Link>
      </div>

      {/* NAVEGACIÓN PRINCIPAL */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.tour}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                active
                  ? "bg-[#2563EB]/20 text-white border-l-4 border-[#3B82F6] pl-3 shadow-inner"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  active ? "text-[#60A5FA]" : "text-slate-400"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER / ESTATUS / PLAN */}
      <div className="p-4 border-t border-slate-800/80 bg-[#081220]/80 space-y-3.5">
        {isFreePlan ? (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sácale provecho a tu búsqueda</span>
            </div>
            <Link
              href="/#precios"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-[#2563EB] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95"
              style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Mejorar Plan
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-2 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs">
            <span className="text-slate-400 text-[11px]">Estatus:</span>
            <span className="font-extrabold text-emerald-400 flex items-center gap-1 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Plan Pro
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center justify-between w-full px-3 py-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs font-medium transition-all cursor-pointer group"
        >
          <span className="flex items-center gap-2">
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Cerrar sesión
          </span>
        </button>
      </div>
    </aside>
  );
}