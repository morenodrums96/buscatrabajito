"use client";

import Link from "next/link";
import { Check, Sparkles, Zap, Flame } from "lucide-react";

const PLANS = [
  {
    name: "Gratis",
    subtitle: "Para empezar a explorar",
    price: "$0",
    period: "para siempre",
    badge: null,
    features: [
      "Alertas por correo · máx. 3/día",
      "OCC y Computrabajo",
      "1 perfil de búsqueda activo",
      "Generador de CV con IA · 1 vez",
      "Descarga tu CV en PDF",
      "Acceso al dashboard básico",
    ],
    cta: "Comenzar gratis",
    href: "/sign-up",
    highlight: false,
  },
  {
    name: "Buscador",
    subtitle: "Para asegurar oportunidades",
    price: "$149",
    period: "MXN / mes",
    badge: "Más Popular",
    features: [
      "Alertas por correo ilimitadas",
      "WhatsApp · máx. 30 mensajes/mes",
      "Todas las fuentes · 7 portales",
      "3 perfiles de búsqueda activos",
      "Ajuste de CV por vacante · 50/mes",
      "Descarga tu CV en PDF",
    ],
    cta: "Empezar con Buscador",
    href: "/sign-up?plan=buscador",
    highlight: true,
  },
  {
    name: "Aplicador",
    subtitle: "Para el profesional activo",
    price: "$299",
    period: "MXN / mes",
    badge: "Pro",
    features: [
      "Todo lo del plan Buscador",
      "WhatsApp · máx. 60 mensajes/mes",
      "Perfiles de búsqueda ilimitados",
      "Ajuste de CV por vacante · 100/mes",
      "Preparación de entrevista con IA · 5/mes",
      "Historial de aplicaciones",
    ],
    cta: "Empezar con Aplicador",
    href: "/sign-up?plan=aplicador",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="precios" className="relative bg-[#060E1A] text-white py-24 px-6 overflow-hidden border-t border-slate-800/60">
      {/* GLOWS Y FONDO DE RED */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#38BDF8 1px, transparent 1px)`,
            backgroundSize: `32px 32px`
          }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold tracking-wider uppercase mb-4">
            <Zap className="w-3.5 h-3.5" />
            Sin complicaciones
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100 mb-4">
            Planes y{" "}
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              precios transparentes
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
            Empieza gratis y actualiza cuando necesites acelerar tu búsqueda laboral.
          </p>
        </div>

        {/* PRICING GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 border ${
                plan.highlight
                  ? "bg-gradient-to-b from-slate-900 via-[#0A1A30] to-slate-900 border-sky-500 shadow-2xl shadow-sky-950/60 lg:-translate-y-2"
                  : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70"
              }`}
            >
              {/* BADGE DESTACADO */}
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 text-white text-[11px] font-bold tracking-wider uppercase shadow-lg shadow-sky-500/30 border border-sky-300/30">
                  <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  {plan.badge}
                </div>
              )}

              <div>
                {/* TITULO & SUBTITULO */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-bold ${plan.highlight ? "text-sky-300" : "text-slate-100"}`}>
                      {plan.name}
                    </h3>
                    {!plan.highlight && plan.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{plan.subtitle}</p>
                </div>

                {/* PRECIO */}
                <div className="flex items-baseline gap-2 pb-6 border-b border-slate-800">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {plan.period}
                  </span>
                </div>

                {/* LISTA DE CARACTERISTICAS */}
                <div className="pt-6 mb-8">
                  <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-4">
                    Incluye:
                  </p>
                  <ul className="space-y-3.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            plan.highlight
                              ? "bg-sky-500/20 text-sky-400 border border-sky-400/30"
                              : "bg-slate-800 text-emerald-400 border border-slate-700"
                          }`}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* BOTON CTA */}
              <Link
                href={plan.href}
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                  plan.highlight
                    ? "bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-lg shadow-sky-600/30 border border-sky-400/30"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                }`}
              >
                {plan.highlight && <Sparkles className="w-3.5 h-3.5 text-sky-200" />}
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* PIE DE PAGINA */}
        <p className="text-center text-xs text-slate-500 mt-12">
          Puedes cambiar de plan o cancelar tu suscripción en cualquier momento sin penalizaciones.
        </p>

      </div>
    </section>
  );
}