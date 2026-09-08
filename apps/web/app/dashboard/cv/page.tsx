"use client";

import { useRef, useState } from "react";
import BusquedaStep from "@/components/BusquedaStep";
import {
  FileText, Upload, Sparkles, Clock, FileCheck,
  Plus, RefreshCw, CheckCircle2, AlertCircle, Loader2,
  ChevronDown, ChevronUp, X,
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

type Step = "idle" | "uploading" | "confirmar" | "busqueda" | "listo";

export default function CVPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [expandExp, setExpandExp] = useState(true);
  const [expandEdu, setExpandEdu] = useState(true);

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

  const uploadStatus = step === "uploading" ? "uploading" : step === "idle" ? "idle" : "done";

  return (
    <>
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
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
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {step !== "idle" ? "Subir nuevo CV" : "Generar nuevo CV"}
        </button>
      </div>

      {/* Panel Dropzone + ATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dropzone */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2563EB]" />
                CV Base Principal
              </h2>
              {step === "confirmar" || step === "busqueda" || step === "listo" ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
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
              {step === "uploading" ? (
                <>
                  <Loader2 className="w-10 h-10 text-[#2563EB] mx-auto mb-3 animate-spin" />
                  <p className="font-bold text-xs text-[#0F2744] mb-1">Analizando {fileName}...</p>
                  <p className="text-[11px] text-slate-400">La IA está extrayendo tu información</p>
                </>
              ) : step !== "idle" ? (
                <>
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <p className="font-bold text-xs text-[#0F2744] mb-1">{fileName}</p>
                  <p className="text-[11px] text-slate-400">Analizado correctamente</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-400 group-hover:text-[#2563EB] mx-auto mb-3 transition-colors" />
                  <p className="font-bold text-xs text-[#0F2744] mb-1">Arrastra tu CV aquí o haz clic para examinar</p>
                  <p className="text-[11px] text-slate-400">Soporta archivos PDF (Máx. 5 MB)</p>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {fileName ? `Última actualización: ${fileName}` : "Sin archivos aún"}
            </span>
            <button onClick={() => { setStep("idle"); setCvData(null); setFileName(null); inputRef.current?.click(); }} className="text-[#2563EB] font-bold hover:underline text-xs flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Re-analizar CV
            </button>
          </div>
        </div>

        {/* ATS Score */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
              Diagnóstico de Legibilidad ATS
            </h2>
            <div className="text-center py-4">
              <div className="text-4xl font-extrabold text-[#0F2744] tracking-tight" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
                --<span className="text-sm font-semibold text-slate-400">/100</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Compatibilidad general</p>
            </div>
            <div className="space-y-2.5 pt-2 text-xs">
              {["Estructura & Formato", "Palabras clave del sector", "Claridad de experiencia"].map((label) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-bold text-slate-400">Pendiente</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button disabled className="w-full py-2.5 px-3 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> Optimizar con IA
            </button>
          </div>
        </div>
      </div>

      {/* ── CONFIRMACIÓN DE DATOS ── */}
      {step === "confirmar" && cvData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base text-[#0F2744]" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
              Confirma tu información
            </h2>
            <span className="text-xs text-slate-500">Revisa y corrige si es necesario</span>
          </div>

          {/* Info personal */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
            <h3 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
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
                    value={cvData[f.field] as string ?? ""}
                    onChange={(e) => updateField(f.field, e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-[#0F2744] outline-none focus:border-[#2563EB] transition-colors"
                  />
                </div>
              ))}

              {/* Idiomas: ocupa una sola columna del grid */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Idiomas</label>
                <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                  {cvData.idiomas.length === 0 ? (
                    <p className="text-xs text-slate-400">Aún no agregas idiomas.</p>
                  ) : cvData.idiomas.map((idi, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Idioma (ej. Inglés)"
                        value={idi.idioma}
                        onChange={(e) => updateIdioma(i, "idioma", e.target.value)}
                        className="flex-1 min-w-0 px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-[#0F2744] outline-none focus:border-[#2563EB] transition-colors"
                      />
                      <select
                        value={idi.nivel}
                        onChange={(e) => updateIdioma(i, "nivel", e.target.value)}
                        className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-[#0F2744] outline-none focus:border-[#2563EB] transition-colors bg-white"
                      >
                        {NIVELES_IDIOMA.map((nivel) => (
                          <option key={nivel} value={nivel}>{nivel}</option>
                        ))}
                      </select>
                      <button onClick={() => removeIdioma(i)} className="text-slate-400 hover:text-red-500 transition-colors p-1 flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button onClick={addIdioma} className="px-4 py-2 bg-[#0F2744] text-white rounded-lg text-xs font-bold hover:bg-[#1a3a5c] transition-colors">
                    + Agregar idioma
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Habilidades */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
            <h3 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
              Habilidades técnicas
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {cvData.habilidades.map((skill, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 bg-blue-50 text-[#2563EB] border border-blue-200 px-3 py-1 rounded-full text-xs font-bold">
                  {skill}
                  <button onClick={() => removeSkill(i)} className="hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Agregar habilidad"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill()}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#2563EB] transition-colors"
              />
              <button onClick={addSkill} className="px-4 py-2 bg-[#0F2744] text-white rounded-lg text-xs font-bold hover:bg-[#1a3a5c] transition-colors">
                + Agregar
              </button>
            </div>
          </div>

          {/* Experiencia */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
            <button
              onClick={() => setExpandExp(!expandExp)}
              className="w-full flex items-center justify-between mb-3"
            >
              <h3 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider">
                Experiencia laboral · {cvData.experiencia.length} registros
              </h3>
              {expandExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {expandExp && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                {cvData.experiencia.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-xs font-bold text-amber-800">Sin experiencia laboral detectada</p>
                    <p className="text-xs text-amber-600 mt-1">Usaremos tus estudios y proyectos para construir tu CV.</p>
                  </div>
                ) : cvData.experiencia.map((exp, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-bold text-sm text-[#0F2744]">{exp.puesto}</p>
                    <p className="text-xs text-[#2563EB] font-semibold mt-0.5">{exp.empresa}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{exp.fechaInicio} — {exp.fechaFin}</p>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{exp.descripcion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Educación */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
            <button
              onClick={() => setExpandEdu(!expandEdu)}
              className="w-full flex items-center justify-between mb-3"
            >
              <h3 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider">
                Educación · {cvData.educacion.length} registros
              </h3>
              {expandEdu ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {expandEdu && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                {cvData.educacion.map((edu, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-bold text-sm text-[#0F2744]">{edu.carrera}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{edu.institucion}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{edu.anio}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botón continuar */}
          <button
            onClick={() => setStep("busqueda")}
            className="w-full py-3.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
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

      {/* ── LISTO ── */}
      {step === "listo" && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-12 shadow-sm text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="font-extrabold text-xl text-[#0F2744] mb-2" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
            ¡Todo listo!
          </h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
            Tu perfil está configurado. Empezamos a buscar vacantes para ti ahora mismo.
          </p>
          <a href="/dashboard" className="inline-block px-8 py-3 bg-[#2563EB] hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-all">
            Ir al dashboard →
          </a>
        </div>
      )}

      {/* Historial de CVs */}
      {step !== "confirmar" && step !== "busqueda" && step !== "listo" && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider">
              Versiones Generadas y Adaptadas
            </h2>
            <span className="text-xs text-slate-400 font-medium">0 documentos creados</span>
          </div>
          <div className="text-center py-12 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-[#0F2744] text-xs mb-1">Aún no has generado versiones personalizadas de tu CV</p>
            <p className="text-slate-400 text-[11px] max-w-sm mx-auto">
              Cuando apliques a vacantes específicas, la plataforma generará adaptaciones optimizadas para cada oferta.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
