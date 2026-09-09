"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import BusquedaStep from "@/components/BusquedaStep";
import {
  FileText, Upload, Sparkles, Clock, FileCheck,
  Plus, RefreshCw, CheckCircle2, Loader2,
  ChevronDown, ChevronUp, X, Briefcase, GraduationCap, Globe
} from "lucide-react";

interface Experiencia {
  empresa: string;
  puesto: string;
  fechaInicio: string;
  fechaFin: string;
  descripcion: string;
}

interface Educacion {
  institucion: string;
  carrera: string;
  anio: string;
}

const NIVELES_IDIOMA = ["A1", "A2", "B1", "B2", "C1", "C2", "Nativo"];

interface CVData {
  nombreCompleto: string;
  email: string;
  telefono: string;
  ciudad: string;
  linkedin: string;
  tituloProfesional: string;
  habilidades: string[];
  idiomas: { idioma: string; nivel: string }[];
  experiencia: Experiencia[];
  educacion: Educacion[];
  tieneExperiencia: boolean;
}

type Step = "idle" | "uploading" | "confirmar" | "busqueda" | "listo" | "procesando";

const SEGUNDOS_REDIRECCION = 5;

export default function CVPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [expandExp, setExpandExp] = useState(true);
  const [expandEdu, setExpandEdu] = useState(true);
  const [segundosRestantes, setSegundosRestantes] = useState(SEGUNDOS_REDIRECCION);

  useEffect(() => {
    if (step !== "listo") return;
    const interval = setInterval(() => {
      setSegundosRestantes((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step === "listo" && segundosRestantes === 0) {
      router.push("/dashboard");
    }
  }, [step, segundosRestantes, router]);

  useEffect(() => {
    fetch("/api/cv/perfil")
      .then((r) => r.json())
      .then((data) => {
        if (!data) return; // No hay CV aún

        if (data.status === "processing") {
          // Mostrar pantalla de carga y reintentar cada 3 segundos
          setStep("procesando");
          const interval = setInterval(() => {
            fetch("/api/cv/perfil")
              .then((r) => r.json())
              .then((d) => {
                if (d?.status === "ready") {
                  clearInterval(interval);
                  setCvData(d);
                  setFileName("CV guardado");
                  setStep("confirmar");
                } else if (d?.status === "error") {
                  clearInterval(interval);
                  setStep("idle");
                }
              });
          }, 3000);
          return () => clearInterval(interval);
        }

        if (data.status === "ready" && data.nombreCompleto) {
          setCvData(data);
          setFileName("CV guardado");
          setStep("confirmar");
        }
      })
      .catch(() => {});
  }, []);

  async function uploadFile(file: File) {
    if (file.type !== "application/pdf") {
      setStep("idle");
      return;
    }
    setFileName(file.name);
    setStep("uploading");

    const formData = new FormData();
    formData.append("cv", file);

    try {
      const res = await fetch("/api/cv/extraer", { method: "POST", body: formData });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCvData(data);
      setStep("confirmar");
    } catch {
      setStep("idle");
    }
  }

  function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (file) uploadFile(file);
  }

  function updateField(field: keyof CVData, value: string) {
    setCvData((d) => d ? { ...d, [field]: value } : d);
  }

  function addSkill() {
    if (!newSkill.trim()) return;
    setCvData((d) => d ? { ...d, habilidades: [...d.habilidades, newSkill.trim()] } : d);
    setNewSkill("");
  }

  function removeSkill(i: number) {
    setCvData((d) => d ? { ...d, habilidades: d.habilidades.filter((_, idx) => idx !== i) } : d);
  }

  function updateIdioma(i: number, field: "idioma" | "nivel", value: string) {
    setCvData((d) => d ? {
      ...d,
      idiomas: d.idiomas.map((idi, idx) => idx === i ? { ...idi, [field]: value } : idi),
    } : d);
  }

  function addIdioma() {
    setCvData((d) => d ? { ...d, idiomas: [...d.idiomas, { idioma: "", nivel: "A1" }] } : d);
  }

  function removeIdioma(i: number) {
    setCvData((d) => d ? { ...d, idiomas: d.idiomas.filter((_, idx) => idx !== i) } : d);
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F2744] tracking-tight" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
            Gestión de Curriculum Vitae
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Crea, optimiza y gestiona tus versiones de CV adaptadas para sistemas ATS.
          </p>
        </div>
        <button
          onClick={() => { setStep("idle"); setCvData(null); setFileName(null); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {step !== "idle" ? "Subir nuevo CV" : "Generar nuevo CV"}
        </button>
      </div>

      {/* Panel Dropzone + ATS Diagnostic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dropzone */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h2 className="font-extrabold text-xs text-[#0F2744] uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2563EB]" />
                CV Base Principal
              </h2>
              {step === "confirmar" || step === "busqueda" || step === "listo" ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                  Formato ATS Detectado
                </span>
              ) : null}
            </div>

            <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            <div
              onClick={() => { if (step === "idle") inputRef.current?.click(); }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                step === "idle" ? "cursor-pointer group" : "cursor-default"
              } ${dragOver ? "border-[#2563EB] bg-blue-50/40" : "border-slate-200 hover:border-[#2563EB]/50 bg-slate-50/50 hover:bg-blue-50/20"}`}
            >
              {step === "uploading" || step === "procesando" ? (
                <div className="py-2">
                  <Loader2 className="w-9 h-9 text-[#2563EB] mx-auto mb-3 animate-spin" />
                  <p className="font-bold text-xs text-[#0F2744] mb-1">
                    {step === "procesando" ? "Analizando tu CV..." : `Analizando ${fileName}...`}
                  </p>
                  <p className="text-[11px] text-slate-400">La IA está extrayendo tu información profesional</p>
                </div>
              ) : step !== "idle" ? (
                <div className="py-2">
                  <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto mb-3" />
                  <p className="font-bold text-xs text-[#0F2744] mb-1">{fileName}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">Analizado y procesado correctamente</p>
                </div>
              ) : (
                <div className="py-2">
                  <Upload className="w-9 h-9 text-slate-400 group-hover:text-[#2563EB] mx-auto mb-3 transition-colors" />
                  <p className="font-bold text-xs text-[#0F2744] mb-1">Arrastra tu CV aquí o haz clic para examinar</p>
                  <p className="text-[11px] text-slate-400">Soporta archivos PDF (Máx. 5 MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {fileName ? `Archivo actual: ${fileName}` : "Sin archivos subidos"}
            </span>
            <button 
              type="button"
              onClick={() => { setStep("idle"); setCvData(null); setFileName(null); setTimeout(() => inputRef.current?.click(), 50); }} 
              className="text-[#2563EB] font-bold hover:underline text-xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Re-analizar CV
            </button>
          </div>
        </div>

        {/* Diagnostic Score */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-extrabold text-xs text-[#0F2744] uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
              Diagnóstico de Legibilidad ATS
            </h2>
            <div className="text-center py-3">
              <div className="text-4xl font-extrabold text-[#0F2744] tracking-tight" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
                --<span className="text-sm font-semibold text-slate-400">/100</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Compatibilidad general ATS</p>
            </div>
            <div className="space-y-2 pt-2 text-xs">
              {["Estructura & Formato", "Palabras clave del sector", "Claridad de experiencia"].map((label) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-100 text-[11px]">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Pendiente</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button disabled className="w-full py-2.5 px-3 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Optimizar con IA
            </button>
          </div>
        </div>
      </div>

      {/* ── PROCESANDO CV EN SEGUNDO PLANO ── */}
      {step === "procesando" && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-16 shadow-sm text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 border-4 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin" />
          </div>
          <h2 className="font-extrabold text-base text-[#0F2744] mb-2" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
            Estamos analizando tu CV...
          </h2>
          <p className="text-xs text-slate-500">
            Nuestra IA está extrayendo tu información. Esto puede tardar unos segundos.
          </p>
        </div>
      )}

      {/* ── CONFIRMACIÓN DE DATOS ── */}
      {step === "confirmar" && cvData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base text-[#0F2744]" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
              Confirma tu información
            </h2>
            <span className="text-xs text-slate-500">Revisa y ajusta los detalles extraídos</span>
          </div>

          {/* Información Personal */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <h3 className="font-extrabold text-xs text-[#0F2744] uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
              Información personal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Nombre completo", field: "nombreCompleto" as keyof CVData },
                { label: "Correo", field: "email" as keyof CVData },
                { label: "Teléfono", field: "telefono" as keyof CVData },
                { label: "Ciudad", field: "ciudad" as keyof CVData },
                { label: "LinkedIn", field: "linkedin" as keyof CVData },
                { label: "Área profesional", field: "tituloProfesional" as keyof CVData },
              ].map((f) => (
                <div key={f.field}>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{f.label}</label>
                  <input
                    type="text"
                    value={(cvData[f.field] as string) ?? ""}
                    onChange={(e) => updateField(f.field, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-[#0F2744] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              ))}

              {/* Idiomas */}
              <div className="sm:col-span-2 mt-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" /> Idiomas
                </label>
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2.5">
                  {cvData.idiomas.length === 0 ? (
                    <p className="text-xs text-slate-400">Sin idiomas asignados.</p>
                  ) : (
                    cvData.idiomas.map((idi, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Idioma (ej. Inglés)"
                          value={idi.idioma}
                          onChange={(e) => updateIdioma(i, "idioma", e.target.value)}
                          className="flex-1 min-w-0 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-[#0F2744] outline-none focus:border-[#2563EB]"
                        />
                        <select
                          value={idi.nivel}
                          onChange={(e) => updateIdioma(i, "nivel", e.target.value)}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-[#0F2744] outline-none focus:border-[#2563EB]"
                        >
                          {NIVELES_IDIOMA.map((nivel) => (
                            <option key={nivel} value={nivel}>{nivel}</option>
                          ))}
                        </select>
                        <button 
                          type="button" 
                          onClick={() => removeIdioma(i)} 
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={addIdioma}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0F2744] hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    + Agregar idioma
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Habilidades */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <h3 className="font-extrabold text-xs text-[#0F2744] uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
              Habilidades técnicas
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {cvData.habilidades.map((skill, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 bg-blue-50 text-[#2563EB] border border-blue-200 px-3 py-1 rounded-lg text-xs font-bold">
                  {skill}
                  <button type="button" onClick={() => removeSkill(i)} className="hover:text-rose-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="Ej. React, Node.js, SQL..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill()}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#2563EB]"
              />
              <button 
                type="button" 
                onClick={addSkill} 
                className="px-4 py-2 bg-[#0F2744] text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Experiencia */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <button
              type="button"
              onClick={() => setExpandExp(!expandExp)}
              className="w-full flex items-center justify-between mb-2 cursor-pointer"
            >
              <h3 className="font-extrabold text-xs text-[#0F2744] uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Experiencia laboral ({cvData.experiencia.length})
              </h3>
              {expandExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {expandExp && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                {cvData.experiencia.length === 0 ? (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4">
                    <p className="text-xs font-bold text-amber-800">Sin experiencia laboral previa detectada</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">Utilizaremos tus proyectos y formación académica para potenciar tu perfil.</p>
                  </div>
                ) : cvData.experiencia.map((exp, i) => (
                  <div key={i} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/70">
                    <p className="font-bold text-xs text-[#0F2744]">{exp.puesto}</p>
                    <p className="text-xs text-[#2563EB] font-semibold mt-0.5">{exp.empresa}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{exp.fechaInicio} — {exp.fechaFin}</p>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{exp.descripcion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Educación */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <button
              type="button"
              onClick={() => setExpandEdu(!expandEdu)}
              className="w-full flex items-center justify-between mb-2 cursor-pointer"
            >
              <h3 className="font-extrabold text-xs text-[#0F2744] uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                Educación ({cvData.educacion.length})
              </h3>
              {expandEdu ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {expandEdu && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                {cvData.educacion.map((edu, i) => (
                  <div key={i} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/70">
                    <p className="font-bold text-xs text-[#0F2744]">{edu.carrera}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{edu.institucion}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{edu.anio}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Continuar */}
          <button
            type="button"
            onClick={() => setStep("busqueda")}
            className="w-full py-3.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
            style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
          >
            Confirmar información → Definir búsquedas
          </button>
        </div>
      )}

      {/* ── BÚSQUEDAS ── */}
      {step === "busqueda" && (
        <BusquedaStep cvData={cvData as Record<string, unknown> | null} onFinish={() => setStep("listo")} />
      )}

      {/* ── FINALIZADO CON AUTO-REDIRECCIÓN ── */}
      <AnimatePresence>
        {step === "listo" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-12 shadow-lg text-center max-w-xl mx-auto"
          >
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2
              className="font-extrabold text-2xl text-[#0F2744] mb-2 tracking-tight"
              style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
            >
              ¡Perfil y CV Guardados con Éxito!
            </h2>

            <p className="text-slate-500 text-xs max-w-md mx-auto mb-6 leading-relaxed">
              Tu información se ha optimizado para ATS. La plataforma está escaneando vacantes en tiempo real asociadas a tu perfil.
            </p>

            <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 mb-6 text-left flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-bold text-[#0F2744]">💡 ¿Qué sigue ahora?</p>
                <p className="text-slate-600 text-[11px]">
                  En tu Panel Principal verás el radar de búsquedas en tiempo real y podrás ajustar tus alertas por correo o WhatsApp.
                </p>
              </div>
            </div>

            {/* Contador de Auto-Redirección */}
            <div className="mb-6">
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((SEGUNDOS_REDIRECCION - segundosRestantes) / SEGUNDOS_REDIRECCION) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Redirigiendo al dashboard en {segundosRestantes}s...
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex px-6 py-3 bg-[#2563EB] hover:bg-blue-600 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              Ir al Dashboard ahora →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Historial de CVs */}
      {step !== "confirmar" && step !== "busqueda" && step !== "listo" && step !== "procesando" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h2 className="font-extrabold text-xs text-[#0F2744] uppercase tracking-wider">
              Versiones Generadas y Adaptadas
            </h2>
            <span className="text-xs text-slate-400 font-medium">0 documentos creados</span>
          </div>
          <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-[#0F2744] text-xs mb-1">Aún no has generado versiones personalizadas</p>
            <p className="text-slate-400 text-[11px] max-w-sm mx-auto">
              Al aplicar a vacantes específicas, el sistema adaptará tu plantilla para optimizar la compatibilidad ATS.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}