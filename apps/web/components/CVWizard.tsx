"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Plus, X, Sparkles, User,
  CheckCircle2, Mail, Phone, MapPin
} from "lucide-react";

export interface CVData {
  nombreCompleto: string;
  email: string;
  telefono: string;
  ciudad: string;
  linkedin: string;
  tituloProfesional: string;
  habilidades: string[];
  idiomas: { idioma: string; nivel: string }[];
  experiencia: { empresa: string; puesto: string; fechaInicio: string; fechaFin: string; descripcion: string }[];
  educacion: { institucion: string; carrera: string; anio: string }[];
  tieneExperiencia: boolean;
}

const NIVELES_IDIOMA = ["A1", "A2", "B1", "B2", "C1", "C2", "Nativo"];

const EMPTY_CV: CVData = {
  nombreCompleto: "", email: "", telefono: "", ciudad: "",
  linkedin: "", tituloProfesional: "", habilidades: [],
  idiomas: [], experiencia: [], educacion: [], tieneExperiencia: true,
};

interface Props {
  initialData?: Partial<CVData>;
  onComplete: (data: CVData) => void;
}

const TOTAL_STEPS = 6;

const stepVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 20 : -20, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
  exit:  (direction: number) => ({ x: direction < 0 ? 20 : -20, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }),
};

// Tokens de marca:
// primary  #2563EB  azul electrico
// navy     #1E3A5F  azul profundo
// green    #10B981  verde acento
// blue-lt  #60A5FA  azul claro sobre oscuro
// tint     #EFF6FF  fondo chips
// dark-bg  #0F2744  fondo oscuro

export default function CVWizard({ initialData, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [dir,  setDir]  = useState(1);
  const [data, setData] = useState<CVData>({ ...EMPTY_CV, ...initialData });

  const [newSkill,  setNewSkill]  = useState("");
  const [newIdioma, setNewIdioma] = useState({ idioma: "", nivel: "B1" });
  const [newExp,    setNewExp]    = useState({ empresa: "", puesto: "", fechaInicio: "", fechaFin: "", descripcion: "" });
  const [newEdu,    setNewEdu]    = useState({ institucion: "", carrera: "", anio: "" });

  const progress = Math.round(((step + 1) / TOTAL_STEPS) * 100);

  function next() { setDir(1);  if (step < TOTAL_STEPS - 1) setStep(p => p + 1); else onComplete(data); }
  function back() { setDir(-1); if (step > 0) setStep(p => p - 1); }

  function addSkill()      { if (!newSkill.trim()) return; setData(d => ({ ...d, habilidades: [...d.habilidades, newSkill.trim()] })); setNewSkill(""); }
  function removeSkill(i: number) { setData(d => ({ ...d, habilidades: d.habilidades.filter((_, idx) => idx !== i) })); }
  function addIdioma()     { if (!newIdioma.idioma.trim()) return; setData(d => ({ ...d, idiomas: [...d.idiomas, newIdioma] })); setNewIdioma({ idioma: "", nivel: "B1" }); }
  function addExperiencia(){ if (!newExp.puesto.trim() || !newExp.empresa.trim()) return; setData(d => ({ ...d, experiencia: [...d.experiencia, newExp] })); setNewExp({ empresa: "", puesto: "", fechaInicio: "", fechaFin: "", descripcion: "" }); }
  function addEducacion()  { if (!newEdu.carrera.trim() || !newEdu.institucion.trim()) return; setData(d => ({ ...d, educacion: [...d.educacion, newEdu] })); setNewEdu({ institucion: "", carrera: "", anio: "" }); }

  const inputCls   = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/30 outline-none transition-all";
  const smInputCls = "px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#2563EB] transition-all";
  const addBtnCls  = "w-full py-2 bg-[#1E3A5F] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#2563EB] transition-colors";

  return (
    <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 relative">

      {/* Contenedor principal */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">

        {/* Columna izquierda: formulario */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-[#2563EB]">
                <Sparkles className="w-4 h-4" /> Configuracion de tu Perfil
              </span>
              <span className="text-xs font-semibold text-slate-400">Paso {step + 1} de {TOTAL_STEPS}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div className="h-full bg-[#2563EB]" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>

          <div className="my-auto py-6">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div key={step} custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" className="space-y-5">

                {step === 0 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-[#1E3A5F] tracking-tight">Empecemos! Quien eres?</h2>
                      <p className="text-xs text-slate-500 mt-1">Ingresa tus datos basicos para que los reclutadores te contacten.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div><label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Nombre Completo *</label>
                        <input type="text" placeholder="Ej. Javier Moreno" value={data.nombreCompleto} onChange={e => setData({ ...data, nombreCompleto: e.target.value })} className={inputCls} /></div>
                      <div><label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Correo Electronico *</label>
                        <input type="email" placeholder="javier@ejemplo.com" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} className={inputCls} /></div>
                      <div><label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Telefono / WhatsApp</label>
                        <input type="tel" placeholder="+52 833 000 0000" value={data.telefono} onChange={e => setData({ ...data, telefono: e.target.value })} className={inputCls} /></div>
                      <div><label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Ciudad / Ubicacion</label>
                        <input type="text" placeholder="Ej. Monterrey, NL" value={data.ciudad} onChange={e => setData({ ...data, ciudad: e.target.value })} className={inputCls} /></div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-[#1E3A5F] tracking-tight">Cual es tu especialidad?</h2>
                      <p className="text-xs text-slate-500 mt-1">Define tu rol para que la IA encuentre las vacantes correctas.</p>
                    </div>
                    <div className="space-y-3 pt-2">
                      <div><label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Titulo Profesional</label>
                        <input type="text" placeholder="Ej. Desarrollador Web Full Stack" value={data.tituloProfesional} onChange={e => setData({ ...data, tituloProfesional: e.target.value })} className={inputCls} /></div>
                      <div><label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Perfil LinkedIn (Opcional)</label>
                        <input type="url" placeholder="https://linkedin.com/in/usuario" value={data.linkedin} onChange={e => setData({ ...data, linkedin: e.target.value })} className={inputCls} /></div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-[#1E3A5F] tracking-tight">Habilidades Clave</h2>
                      <p className="text-xs text-slate-500 mt-1">Agrega las herramientas o tecnologias que dominas.</p>
                    </div>
                    <div className="space-y-3 pt-1">
                      <div className="flex gap-2">
                        <input type="text" placeholder="Ej. React, TypeScript, Figma..." value={newSkill}
                          onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())} className={inputCls} />
                        <button onClick={addSkill} type="button" className="px-4 py-2.5 bg-[#1E3A5F] hover:bg-[#2563EB] text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer">
                          <Plus className="w-3.5 h-3.5" /> Agregar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 min-h-[100px] p-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl items-start">
                        {data.habilidades.length === 0
                          ? <span className="text-xs text-slate-400 self-center mx-auto">Sin habilidades agregadas aun</span>
                          : data.habilidades.map((s, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A5F] font-bold text-xs rounded-lg">
                              {s}<button onClick={() => removeSkill(idx)} className="hover:text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-[#1E3A5F] tracking-tight">Experiencia Laboral</h2>
                      <p className="text-xs text-slate-500 mt-1">Agrega tus empleos anteriores o proyectos destacados.</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input type="text" placeholder="Empresa / Cliente" value={newExp.empresa} onChange={e => setNewExp({ ...newExp, empresa: e.target.value })} className={smInputCls} />
                        <input type="text" placeholder="Puesto / Cargo" value={newExp.puesto} onChange={e => setNewExp({ ...newExp, puesto: e.target.value })} className={smInputCls} />
                        <input type="text" placeholder="Inicio (Ej. Ene 2022)" value={newExp.fechaInicio} onChange={e => setNewExp({ ...newExp, fechaInicio: e.target.value })} className={smInputCls} />
                        <input type="text" placeholder="Fin (Ej. Presente)" value={newExp.fechaFin} onChange={e => setNewExp({ ...newExp, fechaFin: e.target.value })} className={smInputCls} />
                      </div>
                      <textarea placeholder="Descripcion breve de responsabilidades..." value={newExp.descripcion} rows={2}
                        onChange={e => setNewExp({ ...newExp, descripcion: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#2563EB]" />
                      <button type="button" onClick={addExperiencia} className={addBtnCls}>+ Guardar Experiencia</button>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {data.experiencia.map((exp, idx) => (
                        <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                          <div className="truncate pr-2">
                            <p className="text-xs font-bold text-[#1E3A5F] truncate">{exp.puesto} - <span className="text-[#2563EB]">{exp.empresa}</span></p>
                            <p className="text-[10px] text-slate-400">{exp.fechaInicio} - {exp.fechaFin}</p>
                          </div>
                          <button onClick={() => setData(d => ({ ...d, experiencia: d.experiencia.filter((_, i) => i !== idx) }))} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-[#1E3A5F] tracking-tight">Formacion Academica</h2>
                      <p className="text-xs text-slate-500 mt-1">Estudios universitarios, diplomados o certificaciones.</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input type="text" placeholder="Carrera / Titulo" value={newEdu.carrera} onChange={e => setNewEdu({ ...newEdu, carrera: e.target.value })} className={smInputCls} />
                        <input type="text" placeholder="Institucion / Universidad" value={newEdu.institucion} onChange={e => setNewEdu({ ...newEdu, institucion: e.target.value })} className={smInputCls} />
                      </div>
                      <input type="text" placeholder="Anio de egreso (Ej. 2024)" value={newEdu.anio} onChange={e => setNewEdu({ ...newEdu, anio: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#2563EB]" />
                      <button type="button" onClick={addEducacion} className={addBtnCls}>+ Guardar Educacion</button>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {data.educacion.map((edu, idx) => (
                        <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                          <div className="truncate pr-2">
                            <p className="text-xs font-bold text-[#1E3A5F] truncate">{edu.carrera}</p>
                            <p className="text-[10px] text-slate-400">{edu.institucion} ({edu.anio})</p>
                          </div>
                          <button onClick={() => setData(d => ({ ...d, educacion: d.educacion.filter((_, i) => i !== idx) }))} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-[#1E3A5F] tracking-tight">Idiomas y Cierre</h2>
                      <p className="text-xs text-slate-500 mt-1">Indica los idiomas que dominas antes de finalizar.</p>
                    </div>
                    <div className="flex gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                      <input type="text" placeholder="Idioma (Ej. Ingles)" value={newIdioma.idioma}
                        onChange={e => setNewIdioma({ ...newIdioma, idioma: e.target.value })}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#2563EB]" />
                      <select value={newIdioma.nivel} onChange={e => setNewIdioma({ ...newIdioma, nivel: e.target.value })}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none font-semibold text-slate-700">
                        {NIVELES_IDIOMA.map(n => <option key={n}>{n}</option>)}
                      </select>
                      <button onClick={addIdioma} type="button" className="px-4 py-2 bg-[#1E3A5F] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors">+</button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1 min-h-[60px]">
                      {data.idiomas.map((idi, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A5F] font-bold text-xs rounded-xl">
                          {idi.idioma} <span className="text-[#2563EB]">({idi.nivel})</span>
                          <button onClick={() => setData(d => ({ ...d, idiomas: d.idiomas.filter((_, i) => i !== idx) }))} className="hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button onClick={back} disabled={step === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-400 hover:text-[#1E3A5F] disabled:opacity-30 cursor-pointer transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Anterior
            </button>
            <button onClick={next}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-md shadow-[#2563EB]/25 transition-all cursor-pointer">
              {step === TOTAL_STEPS - 1 ? "Completar Configuracion" : "Siguiente"} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Columna derecha: live preview */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#1E3A5F] via-[#0F2744] to-[#0A1929] p-6 sm:p-7 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/40 text-[10px] font-mono text-[#60A5FA]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              VISTA PREVIA EN VIVO
            </div>
            <span className="text-[10px] text-blue-200/50 font-mono">CV ID: #BT-{data.nombreCompleto ? data.nombreCompleto.length * 12 : "00"}</span>
          </div>

          <div className="my-auto py-4">
            <motion.div layout className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-black text-lg shadow-md">
                  {data.nombreCompleto ? data.nombreCompleto.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">
                    {data.nombreCompleto || <span className="text-slate-400 italic">Tu Nombre Aqui</span>}
                  </h4>
                  <p className="text-[11px] text-[#60A5FA] font-medium">
                    {data.tituloProfesional || <span className="text-slate-400 italic">Titulo Profesional</span>}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1.5 pt-1 text-[11px] text-slate-200 border-t border-white/10">
                <div className="flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" /><span className="truncate">{data.email || <span className="text-slate-400">correo@ejemplo.com</span>}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" /><span>{data.telefono || <span className="text-slate-400">+52 ...</span>}</span></div>
                <div className="flex items-center gap-2 truncate"><MapPin className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" /><span>{data.ciudad || <span className="text-slate-400">Ubicacion</span>}</span></div>
              </div>
              {data.habilidades.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider block">Habilidades</span>
                  <div className="flex flex-wrap gap-1">
                    {data.habilidades.slice(0, 5).map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#93C5FD] text-[10px] font-semibold rounded-md">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[11px] text-slate-200">
            <span className="flex items-center gap-1.5 font-mono text-[#10B981]"><CheckCircle2 className="w-3.5 h-3.5" /> Listo para coincidir</span>
            <span className="text-slate-300">{progress}% Completado</span>
          </div>
        </div>
      </div>
    </div>
  );
}