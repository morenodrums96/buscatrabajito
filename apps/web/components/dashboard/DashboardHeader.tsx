"use client";

import { User } from "lucide-react";

interface DashboardHeaderProps {
  displayName: string;
  planLabel: string;
  lastLogin?: string;
}

export default function DashboardHeader({
  displayName,
  planLabel,
}: DashboardHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-8 ml-64 sticky top-0 z-40">
      {/* Subtítulo / Migas de pan */}
      <div className="text-xs text-slate-500 font-medium">
        Resumen general de tu búsqueda
      </div>

      {/* Info Usuario */}
      <div className="flex items-center gap-4">
        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
          {planLabel}
        </span>
        <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold">
          <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          {displayName}
        </div>
      </div>
    </header>
  );
}