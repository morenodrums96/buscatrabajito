"use client";

import { useRef, useState } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  Clock,
  FileCheck,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function CVPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    if (file.type !== "application/pdf") {
      setStatus("error");
      return;
    }
    setFileName(file.name);
    setStatus("uploading");

    const formData = new FormData();
    formData.append("cv", file);

    try {
      const res = await fetch("/api/cv/extraer", { method: "POST", body: formData });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("done");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("503") || message.includes("HTTP 500")) {
        setStatus("error");
        setFileName("El servicio de IA está saturado, intenta en unos minutos");
      } else {
        setStatus("error");
      }
    }
  }

  function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (file) uploadFile(file);
  }

  return (
    <>
      {/* Encabezado de Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1
            className="text-2xl font-extrabold text-[#0F2744] tracking-tight"
            style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
          >
            Gestión de Curriculum Vitae
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Crea, optimiza y gestiona tus versiones de CV adaptadas para sistemas ATS.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          Generar nuevo CV
        </button>
      </div>

      {/* Panel Principal: Subir / Optimizar CV */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tarjeta de Carga de Archivo */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2563EB]" />
                CV Base Principal
              </h2>
              {status === "done" && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Formato ATS Detectado
                </span>
              )}
            </div>

            {/* Zona de Dropzone */}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group ${dragOver
                ? "border-[#2563EB] bg-blue-50/40"
                : "border-slate-200 hover:border-[#2563EB]/50 bg-slate-50/50 hover:bg-blue-50/20"
                }`}
            >
              {status === "uploading" ? (
                <>
                  <Loader2 className="w-10 h-10 text-[#2563EB] mx-auto mb-3 animate-spin" />
                  <p className="font-bold text-xs text-[#0F2744] mb-1">Analizando {fileName}...</p>
                  <p className="text-[11px] text-slate-400">Esto puede tardar unos segundos</p>
                </>
              ) : status === "done" ? (
                <>
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <p className="font-bold text-xs text-[#0F2744] mb-1">{fileName}</p>
                  <p className="text-[11px] text-slate-400">Analizado correctamente · Haz clic para reemplazar</p>
                </>
              ) : status === "error" ? (
                <>
                  <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <p className="font-bold text-xs text-[#0F2744] mb-1">No se pudo procesar el archivo</p>
                  <p className="text-[11px] text-slate-400">Solo aceptamos PDF · Haz clic para intentar de nuevo</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-400 group-hover:text-[#2563EB] mx-auto mb-3 transition-colors" />
                  <p className="font-bold text-xs text-[#0F2744] mb-1">
                    Arrastra tu CV aquí o haz clic para examinar
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Soporta archivos PDF (Máx. 5 MB)
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Última actualización: {status === "done" && fileName ? fileName : "Sin archivos aún"}
            </span>
            <button
              onClick={() => inputRef.current?.click()}
              className="text-[#2563EB] font-bold hover:underline text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-analizar CV
            </button>
          </div>
        </div>

        {/* Panel de Puntuación / Métricas ATS */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
              Diagnóstico de Legibilidad ATS
            </h2>

            <div className="text-center py-4">
              <div
                className="text-4xl font-extrabold text-[#0F2744] tracking-tight"
                style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
              >
                --<span className="text-sm font-semibold text-slate-400">/100</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Compatibilidad general</p>
            </div>

            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Estructura & Formato</span>
                <span className="font-bold text-slate-400">Pendiente</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Palabras clave del sector</span>
                <span className="font-bold text-slate-400">Pendiente</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500">Claridad de experiencia</span>
                <span className="font-bold text-slate-400">Pendiente</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              disabled
              className="w-full py-2.5 px-3 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Optimizar con IA
            </button>
          </div>
        </div>
      </div>

      {/* Historial de CVs Generados */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider">
            Versiones Generadas y Adaptadas
          </h2>
          <span className="text-xs text-slate-400 font-medium">0 documentos creados</span>
        </div>

        <div className="text-center py-12 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
          <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-[#0F2744] text-xs mb-1">
            Aún no has generado versiones personalizadas de tu CV
          </p>
          <p className="text-slate-400 text-[11px] max-w-sm mx-auto">
            Cuando apliques a vacantes específicas, la plataforma generará automáticamente adaptaciones optimizadas para cada oferta.
          </p>
        </div>
      </div>
    </>
  );
}
