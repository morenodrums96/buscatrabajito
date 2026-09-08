"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, CheckCircle2, Search, Zap, ShieldCheck, Mail, MessageSquare, Briefcase, Bell } from "lucide-react";

const TRUST_BADGES = [
  "100% gratis para empezar",
  "Sin spam",
  "7 portales de empleo",
  "Alertas cada 30 min",
];

const PORTALES = [
  "LinkedIn", "OCC Mundial", "Computrabajo", "Bumeran", "Indeed", "Glassdoor", "Workana"
];

const ROLES_DEMO = [
  { title: "Gerente de Ventas", score: "98% ATS Score", detail: "Optimizado para sector comercial", salary: "$35,000 - $45,000 MXN" },
  { title: "Analista Financiero", score: "95% ATS Score", detail: "Adaptado a vacantes bancarias", salary: "$28,000 - $35,000 MXN" },
  { title: "Especialista en Marketing", score: "97% ATS Score", detail: "Palabras clave de growth y RRSS", salary: "$25,000 - $32,000 MXN" },
  { title: "Coordinador de RRHH", score: "94% ATS Score", detail: "Estructura profesional de talento", salary: "$22,000 - $30,000 MXN" },
];

export default function HeroSection() {
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRoleIndex((prev) => (prev + 1) % ROLES_DEMO.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const activeRole = ROLES_DEMO[currentRoleIndex];

  return (
    <section className="relative overflow-hidden bg-[#09172A] text-white pt-28 pb-20 lg:pt-36 lg:pb-28">
      {/* GLOWS DE COLOR Y AURORA ESPACIAL */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Pattern Grid Vectorial */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(#60A5FA 1px, transparent 1px)`,
            backgroundSize: `32px 32px`
          }}
        />
        {/* Glow Superior Cyan/Azul */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-tr from-blue-600/35 via-cyan-500/20 to-emerald-500/10 blur-[130px] rounded-full animate-pulse" />
        {/* Glows Laterales para dar contraste */}
        <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full" />
        <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] bg-sky-500/15 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-center text-center">

        {/* EYEBROW PILL CON DEGRADADO Y BRILLO */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 backdrop-blur-md shadow-lg shadow-sky-950/50 mb-8 transform hover:scale-105 transition-transform">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
          <span className="text-xs font-bold bg-gradient-to-r from-slate-100 via-sky-200 to-emerald-300 bg-clip-text text-transparent tracking-wide uppercase">
            Búsqueda e Inteligencia Automatizada 24/7
          </span>
        </div>

        {/* HEADLINE PRINCIPAL */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] max-w-4xl text-slate-100 mb-6">
          Nosotros buscamos. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Tú eliges dónde aplicar.
          </span>
        </h1>

        {/* SUBTITULO */}
        <p className="text-base sm:text-lg lg:text-xl text-slate-300/90 max-w-2xl font-normal leading-relaxed mb-10">
          Escaneamos OCC, LinkedIn, Computrabajo, Bumeran y más en tiempo real.
          La IA encuentra vacantes para tu profesión, optimiza tu CV y te avisa al instante.
        </p>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-12">
          <Link
            href="/sign-up"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white/10 hover:bg-white/15 text-white font-bold text-sm rounded-xl border border-white/20 hover:border-sky-400/50 shadow-lg shadow-sky-950/30 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Crear cuenta gratis</span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#como-funciona"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition-all shadow-md"
          >
            Ver cómo funciona
          </a>
        </div>

        {/* TRUST BADGES */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 max-w-3xl border-t border-slate-800/80 pt-8 mb-16">
          {TRUST_BADGES.map((badge) => (
            <div key={badge} className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{badge}</span>
            </div>
          ))}
        </div>

        {/* CONTAINER DEL SHOWCASE CON ELEMENTOS FLOTANTES */}
        <div className="relative w-full max-w-5xl">

          {/* BADGE FLOTANTE IZQUIERDA: Notificación en Vivo */}
          <div className="hidden lg:flex absolute -left-12 top-16 z-20 items-center gap-3 bg-slate-900/90 border border-emerald-500/40 p-3.5 rounded-xl shadow-2xl backdrop-blur-md animate-bounce-slow">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Bell className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">¡Nueva Alerta!</p>
              <p className="text-xs font-bold text-white">Coincidencia al 98% en OCC</p>
            </div>
          </div>

          {/* BADGE FLOTANTE DERECHA: Optimización IA */}
          <div className="hidden lg:flex absolute -right-12 bottom-12 z-20 items-center gap-3 bg-slate-900/90 border border-sky-500/40 p-3.5 rounded-xl shadow-2xl backdrop-blur-md">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-sky-400 font-bold">Motor IA Adaptativo</p>
              <p className="text-xs font-bold text-white">CV listo para descargar</p>
            </div>
          </div>

          {/* MARCO PRINCIPAL DEL MOCKUP */}
          <div className="relative rounded-2xl border border-slate-700/80 bg-gradient-to-b from-[#0D1F38] to-[#081324] p-3 sm:p-4 shadow-2xl shadow-blue-950/80 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 px-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800/90 text-[11px] text-slate-300 font-mono border border-slate-700/60">
                buscotrabajito // motor_de_busqueda_activo
              </div>
            </div>

            <div className="bg-[#060E1A] rounded-xl p-6 text-left grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-800/80 relative overflow-hidden">
              {/* Laser Line Scan */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

              {/* Métrica 1: Búsqueda 24/7 */}
              <div className="p-4 bg-slate-900/70 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Escaneo en 7 Portales</span>
                  <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                </div>
                <div className="text-xl font-extrabold text-white">Cada 30 min</div>
                <p className="text-[11px] text-slate-400 mt-0.5">OCC, Computrabajo, LinkedIn y más</p>
              </div>

              {/* Métrica 2: Adaptación de CV Dinámica */}
              <div className="p-4 bg-slate-900/70 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compatibilidad de CV</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-extrabold text-emerald-400 transition-all duration-300">
                  {activeRole.score}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 transition-all duration-300">
                  {activeRole.detail}
                </p>
              </div>

              {/* Métrica 3: Alerta Inteligente */}
              <div className="p-4 bg-gradient-to-br from-blue-950/60 via-slate-900/80 to-slate-900/60 rounded-lg border border-sky-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-xs font-bold text-sky-300">Nueva vacante hallada</span>
                  </div>
                  <div className="flex gap-1.5 text-sky-400">
                    <Mail className="w-3.5 h-3.5" />
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
                <p className="text-xs font-bold text-white transition-all duration-300">
                  {activeRole.title}
                </p>
                <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                  {activeRole.salary}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MARQUEE / CARRUSEL DE PORTALES INTEGRADORAS */}
        <div className="mt-16 w-full max-w-4xl border-t border-slate-800/60 pt-8">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
            Monitoreando vacantes de los mejores portales de empleo
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-60 grayscale hover:grayscale-0 transition-all">
            {PORTALES.map((portal) => (
              <span key={portal} className="text-sm font-extrabold text-slate-300 tracking-tight">
                {portal}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}