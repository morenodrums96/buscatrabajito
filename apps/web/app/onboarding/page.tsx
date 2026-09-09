"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TOUR_KEY } from "@/components/dashboard/ProductTour";
import {
  Sparkles,
  UploadCloud,
  FilePlus,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Briefcase,
  User,
  Phone,
  AlertCircle,
} from "lucide-react";

type Step = "bienvenida" | "datos" | "cv" | "finalizando";

const FRASES_BIENVENIDA = ["Bienvenido a BuscoTrabajito"];

const FRASES_FINALIZANDO = [
  "Estamos preparando tu espacio personalizado...",
  "Conectando con los mejores portales de empleo...",
  "Todo listo para impulsar tu carrera.",
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("bienvenida");
  const [fraseIndex, setFraseIndex] = useState(0);

  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [telefono, setTelefono] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Partículas memorizadas para evitar recrear instancias en cada render
  const particles = useMemo(() => Array.from({ length: 6 }), []);

  // Cada vez que se entra a onboarding, se reinicia el tour del dashboard,
  // así siempre vuelve a salir al terminar y llegar a /dashboard.
  useEffect(() => {
    localStorage.removeItem(TOUR_KEY);
  }, []);

  // Auto-capitalizar la primera letra solo una vez por campo: si el usuario
  // borra esa mayúscula y vuelve a escribir en minúscula, ya no se vuelve a forzar.
  const nombreCapRef = useRef(false);
  const paternoCapRef = useRef(false);
  const maternoCapRef = useRef(false);

  function handleNombreChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (!nombreCapRef.current && nombre === "" && val.length > 0) {
      nombreCapRef.current = true;
      setNombre(val.charAt(0).toUpperCase() + val.slice(1));
    } else {
      setNombre(val);
    }
  }

  function handlePaternoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (!paternoCapRef.current && apellidoPaterno === "" && val.length > 0) {
      paternoCapRef.current = true;
      setApellidoPaterno(val.charAt(0).toUpperCase() + val.slice(1));
    } else {
      setApellidoPaterno(val);
    }
  }

  function handleMaternoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (!maternoCapRef.current && apellidoMaterno === "" && val.length > 0) {
      maternoCapRef.current = true;
      setApellidoMaterno(val.charAt(0).toUpperCase() + val.slice(1));
    } else {
      setApellidoMaterno(val);
    }
  }

  // Secuencia de bienvenida estilo OOBE
  useEffect(() => {
    if (step === "bienvenida") {
      const interval = setInterval(() => {
        setFraseIndex((prev) => {
          if (prev < FRASES_BIENVENIDA.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            setTimeout(() => setStep("datos"), 1000);
            return prev;
          }
        });
      }, 2400);

      return () => clearInterval(interval);
    }
  }, [step]);

  // Secuencia de cierre tras subir el CV, antes de entrar al dashboard
  useEffect(() => {
    if (step === "finalizando") {
      const interval = setInterval(() => {
        setFraseIndex((prev) => {
          if (prev < FRASES_FINALIZANDO.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            setTimeout(() => {
              setIsClosing(true);
              setTimeout(() => router.push("/dashboard"), 700);
            }, 1200);
            return prev;
          }
        });
      }, 2400);

      return () => clearInterval(interval);
    }
  }, [step, router]);


  async function handleDatos(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/nombre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          apellidoPaterno,
          apellidoMaterno,
          telefono,
        }),
      });

      if (!res.ok) throw new Error("No se pudieron guardar tus datos.");

      setStep("cv");
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocurrió un error al guardar tus datos. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCVUpload(file: File) {
    setUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("cv", file);
      const res = await fetch("/api/cv/subir", { method: "POST", body: formData });

      if (!res.ok) throw new Error("No se pudo subir el archivo.");

      setFraseIndex(0);
      setStep("finalizando");
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al subir el CV. Intenta subir un archivo PDF válido.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* EFECTOS DE FONDO */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-blue-600/20 via-sky-500/20 to-indigo-600/10 blur-[140px] rounded-full pointer-events-none -z-10"
      />

      <motion.div
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -50, 20, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/25 rounded-full blur-[100px] pointer-events-none"
      />

      <motion.div
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -40, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 -right-20 w-96 h-96 bg-sky-500/20 rounded-full blur-[120px] pointer-events-none"
      />

      {/* Partículas animadas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: "100vh", opacity: 0 }}
            animate={{
              y: "-10vh",
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "linear",
            }}
            style={{ left: `${15 + i * 15}%` }}
            className="absolute w-1 h-1 bg-sky-400 rounded-full shadow-[0_0_12px_#38bdf8]"
          />
        ))}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <AnimatePresence mode="wait">
        {/* STEP 1: BIENVENIDA */}
        {step === "bienvenida" && (
          <motion.div
            key="bienvenida"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(12px)", scale: 0.92 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center justify-center text-center max-w-xl z-10 px-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-8 relative"
            >
              <div className="w-22 h-22 rounded-3xl bg-gradient-to-tr from-blue-600 via-sky-400 to-indigo-500 p-[1.5px] shadow-[0_0_50px_rgba(56,189,248,0.3)]">
                <div className="w-full h-full bg-[#060E1A]/90 backdrop-blur-2xl rounded-[22px] flex items-center justify-center">
                  <Briefcase className="w-10 h-10 text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                </div>
              </div>
            </motion.div>

            <div className="h-28 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={fraseIndex}
                  initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -15, filter: "blur(8px)" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight"
                >
                  {fraseIndex === 0 ? (
                    <>
                      Bienvenido a{" "}
                      <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent drop-shadow-sm">
                        BuscoTrabajito
                      </span>
                    </>
                  ) : (
                    FRASES_BIENVENIDA[fraseIndex]
                  )}
                </motion.h1>
              </AnimatePresence>
            </div>

            <div className="w-56 h-1.5 bg-slate-800/80 rounded-full overflow-hidden mt-6 relative border border-slate-700/50 shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-400 rounded-full shadow-[0_0_12px_#38bdf8]"
                initial={{ width: "0%" }}
                animate={{ width: `${((fraseIndex + 1) / FRASES_BIENVENIDA.length) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}

        {/* STEP 2: DATOS */}
        {step === "datos" && (
          <motion.div
            key="datos"
            initial={{ opacity: 0, y: 25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.96 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-lg z-10"
          >
            <div className="bg-[#0A1220]/80 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />

              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-3 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
                  <Sparkles className="w-3.5 h-3.5" /> Paso 1 de 2
                </span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Antes de comenzar
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  ¿Cómo te llamas?
                </h2>
                <p className="text-slate-400 text-sm mt-1.5">
                  Ingresa tus datos personales para personalizar tu experiencia.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleDatos} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 ml-1">
                      Nombre <span className="text-sky-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ej. Javier"
                        value={nombre}
                        onChange={handleNombreChange}
                        required
                        className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all pl-10"
                      />
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 ml-1">
                      Apellido Paterno <span className="text-sky-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ej. Moreno"
                      value={apellidoPaterno}
                      onChange={handlePaternoChange}
                      required
                      className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 ml-1">
                      Apellido Materno
                    </label>
                    <input
                      type="text"
                      placeholder="ej. Rojas"
                      value={apellidoMaterno}
                      onChange={handleMaternoChange}
                      className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 ml-1">
                      Número de Teléfono / WhatsApp <span className="text-sky-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="8112345678"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        maxLength={10}
                        pattern="\d{10}"
                        title="Ingresa un número de 10 dígitos"
                        required
                        className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all pl-10"
                      />
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={saving}
                  className="w-full mt-4 py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold rounded-xl text-sm transition-all shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando datos...</span>
                    </>
                  ) : (
                    <>
                      <span>Continuar</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}

        {/* STEP 3: SUBIDA DE CV */}
        {step === "cv" && (
          <motion.div
            key="cv"
            initial={{ opacity: 0, y: 25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.96 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md z-10"
          >
            <div className="bg-[#0A1220]/80 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <CheckCircle2 className="w-3.5 h-3.5" /> ¡Casi listo, {nombre || "usuario"}!
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                ¿Ya tienes tu CV?
              </h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Puedes subir tu archivo PDF actual o dejar que la Inteligencia Artificial lo redacte por ti.
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-3">
                <label className="group relative flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold rounded-2xl text-sm transition-all shadow-[0_0_25px_rgba(56,189,248,0.3)] cursor-pointer overflow-hidden">
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span>Subiendo y analizando CV...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Sí, subir mi CV (PDF)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf"
                    disabled={uploading}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCVUpload(file);
                    }}
                  />
                </label>

                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => {
                    setFraseIndex(0);
                    setStep("finalizando");
                  }}
                  className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white font-semibold rounded-2xl text-sm transition-all cursor-pointer"
                >
                  <FilePlus className="w-4 h-4 text-slate-400" />
                  <span>No tengo CV — Crearlo con IA</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: FINALIZANDO */}
        {step === "finalizando" && (
          <motion.div
            key="finalizando"
            initial={{ opacity: 0 }}
            animate={{
              opacity: isClosing ? 0 : 1,
              scale: isClosing ? 0.94 : 1,
              filter: isClosing ? "blur(14px)" : "blur(0px)",
            }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="flex flex-col items-center justify-center text-center max-w-xl z-10 px-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-8 relative"
            >
              <div className="w-22 h-22 rounded-3xl bg-gradient-to-tr from-blue-600 via-sky-400 to-indigo-500 p-[1.5px] shadow-[0_0_50px_rgba(56,189,248,0.3)]">
                <div className="w-full h-full bg-[#060E1A]/90 backdrop-blur-2xl rounded-[22px] flex items-center justify-center">
                  <Briefcase className="w-10 h-10 text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                </div>
              </div>
            </motion.div>

            <div className="h-28 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={fraseIndex}
                  initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -15, filter: "blur(8px)" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight"
                >
                  {FRASES_FINALIZANDO[fraseIndex]}
                </motion.h1>
              </AnimatePresence>
            </div>

            <div className="w-56 h-1.5 bg-slate-800/80 rounded-full overflow-hidden mt-6 relative border border-slate-700/50 shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-400 rounded-full shadow-[0_0_12px_#38bdf8]"
                initial={{ width: "0%" }}
                animate={{ width: `${((fraseIndex + 1) / FRASES_FINALIZANDO.length) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}