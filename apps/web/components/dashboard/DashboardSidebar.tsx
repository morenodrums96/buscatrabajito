"use client";

import Link from "next/link";
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Settings, 
  Sparkles, 
  LogOut 
} from "lucide-react";

interface DashboardSidebarProps {
  pathname: string;
  isFreePlan: boolean;
  onSignOut: () => void;
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Resumen", href: "/dashboard" },
  { icon: FileText, label: "Mi CV", href: "/dashboard/cv" },
  { icon: Search, label: "Vacantes", href: "/dashboard/vacantes" },
  { icon: Settings, label: "Configuración", href: "/dashboard/configuracion" },
];

export default function DashboardSidebar({
  pathname,
  isFreePlan,
  onSignOut,
}: DashboardSidebarProps) {
  return (
    <aside className="w-64 bg-[#0B192C] text-white flex flex-col fixed top-0 left-0 bottom-0 z-50 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
        <Link
          href="/"
          className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1"
          style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
        >
          Busco<span className="text-[#60A5FA]">Trabajito</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all ${
                active
                  ? "bg-[#1E3A8A]/50 text-white border-l-4 border-[#3B82F6] pl-2.5"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-[#60A5FA]" : "text-slate-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Metrics & Actions (Inspirado en Yotepresto) */}
      <div className="p-4 border-t border-slate-800/80 bg-[#081220]/60 space-y-4">
        {isFreePlan && (
          <Link
            href="/#precios"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-[#2563EB] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all shadow-md"
            style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
          >
            <Sparkles className="w-4 h-4" />
            Mejorar plan
          </Link>
        )}

        {/* Cajas de resumen rápido al pie del menú */}
        <div className="pt-2 border-t border-slate-800/60 space-y-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Estatus de cuenta:</span>
            <span className="font-bold text-slate-200">
              {isFreePlan ? "Plan Gratuito" : "Plan Activo"}
            </span>
          </div>
        </div>

        <button
          onClick={onSignOut}
          className="flex items-center gap-2 w-full pt-2 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer font-medium"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}