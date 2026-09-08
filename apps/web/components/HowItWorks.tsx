"use client";

import { 
  UserPlus, 
  Sliders, 
  Bot, 
  BellRing, 
  FileCheck2, 
  CheckCircle, 
  Sparkles 
} from "lucide-react";

const STEPS = [
  {
    num: "01",
    title: "Crea tu perfil",
    desc: "Sube tu CV o deja que nuestra IA lo cree por ti.",
    icon: UserPlus,
    badge: null,
  },
  {
    num: "02",
    title: "Define qué buscas",
    desc: "Indica el puesto, experiencia, ubicación y modalidad que buscas.",
    icon: Sliders,
    badge: null,
  },
  {
    num: "03",
    title: "Buscamos por ti",
    desc: "Revisamos múltiples portales de empleo automáticamente cada 30 minutos.",
    icon: Bot,
    featured: true,
    badge: "IA Automatizada",
  },
  {
    num: "04",
    title: "Te avisamos",
    desc: "Cuando encontramos una vacante que encaja contigo, te enviamos una alerta.",
    icon: BellRing,
    badge: null,
  },
  {
    num: "05",
    title: "Ajustamos tu CV",
    desc: "La IA adapta tu CV para destacar lo que busca cada vacante.",
    icon: FileCheck2,
    featured: true,
    badge: "Optimización ATS",
  },
  {
    num: "06",
    title: "Tú decides y aplicas",
    desc: "Revisas las oportunidades, eliges dónde aplicar y llevas el control.",
    icon: CheckCircle,
    badge: null,
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="relative bg-[#060E1A] text-white py-24 px-6 overflow-hidden">
      {/* GLOWS DE FONDO */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(#38BDF8 1px, transparent 1px)`,
            backgroundSize: `32px 32px`
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-sky-600/10 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Paso a paso
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100 mb-4">
            Cómo funciona{" "}
            <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
              BuscoTrabajito
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
            Configura tu búsqueda una vez y deja que nuestra inteligencia artificial haga el trabajo pesado por ti.
          </p>
        </div>

        {/* PROCESS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className={`relative group rounded-2xl p-7 transition-all duration-300 flex flex-col justify-between border ${
                  step.featured
                    ? "bg-gradient-to-b from-slate-900/90 to-slate-900/50 border-sky-500/50 shadow-xl shadow-sky-950/40 hover:border-sky-400"
                    : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70"
                } hover:-translate-y-1`}
              >
                {/* Glow decorativo en hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div>
                  {/* CARD HEADER */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm border ${
                          step.featured
                            ? "bg-sky-500/20 border-sky-400/40 text-sky-300"
                            : "bg-slate-800/80 border-slate-700/80 text-slate-300"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {step.num}
                      </span>
                    </div>

                    {step.badge && (
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        {step.badge}
                      </span>
                    )}
                  </div>

                  {/* TITULO Y DESCRIPCION */}
                  <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-sky-300 transition-colors">
                    {step.title}
                  </h3>

                  <p className="text-sm text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM STATEMENT */}
        <div className="mt-16 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-slate-900/80 border border-slate-800 text-center max-w-3xl mx-auto backdrop-blur-md shadow-2xl">
          <p className="text-base sm:text-lg text-slate-300">
            <strong className="text-white font-bold bg-gradient-to-r from-sky-300 to-emerald-300 bg-clip-text text-transparent">
              Tú no tienes que buscar todos los días.
            </strong>{" "}
            Nosotros monitoreamos las vacantes y te guiamos en cada oportunidad.
          </p>
        </div>

      </div>
    </section>
  );
}