"use client";

import Link from "next/link";

interface ProfileData {
  puesto?: string;
  nivel?: string;
  ubicacion?: string;
  modalidad?: string;
}

export default function DashboardProfileCard({ profile }: { profile: ProfileData | null }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <h2
          className="font-extrabold text-base text-[#0F2744]"
          style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
        >
          Mi perfil de búsqueda
        </h2>
        <Link
          href="/onboarding"
          className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold transition-colors"
        >
          Editar →
        </Link>
      </div>

      {profile?.puesto ? (
        <div className="divide-y divide-slate-100">
          {[
            { label: "Puesto", value: profile.puesto },
            { label: "Nivel", value: profile.nivel },
            { label: "Ubicación", value: profile.ubicacion },
            { label: "Modalidad", value: profile.modalidad },
          ].map((row) => (
            <div key={row.label} className="flex justify-between py-3 text-sm">
              <span className="text-slate-500 font-medium">{row.label}</span>
              <span className="text-[#0F2744] font-semibold">{row.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-500 text-xs mb-3">No has configurado tu perfil aún.</p>
          <Link
            href="/onboarding"
            className="inline-block bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Configurar ahora →
          </Link>
        </div>
      )}
    </div>
  );
}