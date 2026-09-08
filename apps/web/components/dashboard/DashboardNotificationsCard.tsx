"use client";

interface DashboardNotificationsProps {
  email?: string;
  whatsapp?: string;
  isPaidPlan: boolean;
}

export default function DashboardNotificationsCard({
  email,
  whatsapp,
  isPaidPlan,
}: DashboardNotificationsProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
      <h2
        className="font-extrabold text-base text-[#0F2744] mb-5"
        style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
      >
        Notificaciones
      </h2>
      <div className="space-y-3">
        {[
          {
            icon: "✉️",
            label: "Correo electrónico",
            value: email ?? "Cargando...",
            activo: true,
          },
          {
            icon: "💬",
            label: "WhatsApp",
            value: whatsapp ?? "No configurado",
            activo: isPaidPlan,
          },
        ].map((n) => (
          <div
            key={n.label}
            className="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-slate-200/60 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{n.icon}</span>
              <div>
                <p className="text-xs font-bold text-[#0F2744]">{n.label}</p>
                <p className="text-xs text-slate-500">{n.value}</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                n.activo ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
              }`}
            >
              {n.activo ? "Activo" : "Plan de pago"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}