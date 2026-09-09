"use client";

import { useEffect, useState } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";

const ESTADOS = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima",
  "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo",
  "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca",
  "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
  "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
];

const MODALIDADES = ["Presencial", "Remoto", "Híbrido"];
const TIPOS_TRABAJO = ["Tiempo completo", "Medio tiempo", "Contrato", "Prácticas"];
const NIVELES_PROFESIONALES = [
  "Sin experiencia / Prácticas",
  "Junior (menos de 2 años)",
  "Semi-Senior (2-4 años)",
  "Senior (5+ años)",
  "Líder / Manager",
  "Director o superior",
];

interface Props {
  cvData: Record<string, unknown> | null;
  onFinish: () => void;
}

interface Perfil {
  puesto: string;
  activo: boolean;
  prioridad: number;
}

export default function BusquedaStep({ cvData, onFinish }: Props) {
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nuevoPuesto, setNuevoPuesto] = useState("");
  const [saving, setSaving] = useState(false);

  // Config global
  const [estadosSeleccionados, setEstadosSeleccionados] = useState<string[]>(["Nuevo León"]);
  const [remotoUSA, setRemotoUSA] = useState(false);
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [tiposTrabajo, setTiposTrabajo] = useState<string[]>(["Tiempo completo"]);
  const [nivelProfesional, setNivelProfesional] = useState("");
  const [salarioMinimo, setSalarioMinimo] = useState("");
  const [aceptaNivelInferior, setAceptaNivelInferior] = useState(false);

  useEffect(() => {
    fetch("/api/cv/sugerir-puestos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvData }),
    })
      .then((r) => r.json())
      .then((data) => {
        setPerfiles((data.puestos ?? []).map((p: string, i: number) => ({ puesto: p, activo: true, prioridad: i + 1 })));
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, [cvData]);

  function toggleEstado(estado: string) {
    setEstadosSeleccionados((prev) =>
      prev.includes(estado) ? prev.filter((e) => e !== estado) : [...prev, estado]
    );
  }

  const todoMexico = estadosSeleccionados.length === ESTADOS.length;
  function toggleTodoMexico() {
    setEstadosSeleccionados(todoMexico ? [] : [...ESTADOS]);
  }

  function toggleModalidad(m: string) {
    setModalidades((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  }

  function toggleTipoTrabajo(t: string) {
    setTiposTrabajo((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  function togglePerfil(i: number) {
    setPerfiles((ps) => ps.map((p, idx) => idx === i ? { ...p, activo: !p.activo } : p));
  }

  function removePerfil(i: number) {
    setPerfiles((ps) => ps.filter((_, idx) => idx !== i));
  }

  function moverArriba(i: number) {
    if (i === 0) return;
    setPerfiles((ps) => {
      const arr = [...ps];
      [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      return arr.map((p, idx) => ({ ...p, prioridad: idx + 1 }));
    });
  }

  function moverAbajo(i: number) {
    setPerfiles((ps) => {
      if (i === ps.length - 1) return ps;
      const arr = [...ps];
      [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      return arr.map((p, idx) => ({ ...p, prioridad: idx + 1 }));
    });
  }

  function agregarPuesto() {
    if (!nuevoPuesto.trim()) return;
    setPerfiles((ps) => [...ps, { puesto: nuevoPuesto.trim(), activo: true, prioridad: ps.length + 1 }]);
    setNuevoPuesto("");
  }

  async function handleGuardar() {
    setSaving(true);
    const activos = perfiles
      .filter((p) => p.activo)
      .map((p) => ({
        puesto: p.puesto,
        prioridad: p.prioridad,
        estados: estadosSeleccionados,
        remotoUSA,
        modalidades,
        tiposTrabajo,
        nivelProfesional,
        salarioMinimo: salarioMinimo ? parseInt(salarioMinimo) : null,
        aceptaNivelInferior,
      }));

    await fetch("/api/cv/guardar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvData, perfiles: activos }),
    });
    setSaving(false);
    onFinish();
  }

  if (cargando) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl p-16 shadow-sm text-center">
        <div className="text-4xl mb-4 animate-pulse">🤖</div>
        <h2 className="font-extrabold text-base text-[#0F2744] mb-2" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
          Analizando tu perfil...
        </h2>
        <p className="text-xs text-slate-500">La IA está identificando los puestos ideales para ti.</p>
      </div>
    );
  }

  const activosCount = perfiles.filter((p) => p.activo).length;
  const canSave = activosCount > 0 && modalidades.length > 0 && estadosSeleccionados.length > 0 && nivelProfesional !== "";

  return (
    <div className="space-y-4">

      {/* Puestos */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
        <div className="pb-3 border-b border-slate-100 mb-4">
          <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider">Puestos a buscar</h2>
          <p className="text-xs text-slate-500 mt-1">Activa los que te interesan, ajusta el orden de prioridad o agrega los tuyos.</p>
        </div>

        <div className="space-y-2 mb-4">
          {perfiles.map((perfil, i) => (
            <div key={i} className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
              perfil.activo ? "border-[#2563EB] bg-blue-50/40" : "border-slate-200 bg-slate-50/50 opacity-60"
            }`}>
              {/* Checkbox */}
              <button onClick={() => togglePerfil(i)} className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                perfil.activo ? "bg-[#2563EB] border-[#2563EB]" : "border-slate-300 bg-white"
              }`}>
                {perfil.activo && <svg viewBox="0 0 12 12" width="10" height="10" fill="none"><path d="M2 6l2.5 2.5L10 3.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>

              {/* Prioridad */}
              <span className="text-[10px] font-bold text-slate-400 w-4 text-center flex-shrink-0">#{i + 1}</span>

              {/* Nombre */}
              <span className={`flex-1 text-sm font-semibold ${perfil.activo ? "text-[#0F2744]" : "text-slate-400"}`}>
                {perfil.puesto}
              </span>

              {/* Controles de prioridad */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button onClick={() => moverArriba(i)} disabled={i === 0} className="p-0.5 text-slate-400 hover:text-[#2563EB] disabled:opacity-20 transition-colors">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => moverAbajo(i)} disabled={i === perfiles.length - 1} className="p-0.5 text-slate-400 hover:text-[#2563EB] disabled:opacity-20 transition-colors">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Eliminar */}
              <button onClick={() => removePerfil(i)} className="p-1 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <input
            type="text"
            placeholder="Agregar otro puesto..."
            value={nuevoPuesto}
            onChange={(e) => setNuevoPuesto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregarPuesto()}
            className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#2563EB] transition-colors"
          />
          <button onClick={agregarPuesto} className="px-4 py-2.5 bg-[#0F2744] text-white rounded-lg text-xs font-bold hover:bg-[#1a3a5c] transition-colors">
            + Agregar
          </button>
        </div>
      </div>

      {/* Tipo de trabajo */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
        <div className="pb-3 border-b border-slate-100 mb-4">
          <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider">Tipo de trabajo</h2>
          <p className="text-xs text-slate-500 mt-1">Puedes elegir más de uno.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TIPOS_TRABAJO.map((t) => (
            <button key={t} onClick={() => toggleTipoTrabajo(t)} className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
              tiposTrabajo.includes(t) ? "bg-[#2563EB] text-white border-[#2563EB]" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#2563EB]/50"
            }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Nivel profesional */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
        <div className="pb-3 border-b border-slate-100 mb-4">
          <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider">Nivel profesional actual *</h2>
          <p className="text-xs text-slate-500 mt-1">Requerido para afinar los resultados.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {NIVELES_PROFESIONALES.map((n) => (
            <button key={n} onClick={() => setNivelProfesional(n)} className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all text-left ${
              nivelProfesional === n ? "bg-[#2563EB] text-white border-[#2563EB]" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#2563EB]/50"
            }`}>
              {n}
            </button>
          ))}
        </div>

        {/* Acepta nivel inferior */}
        <div onClick={() => setAceptaNivelInferior(!aceptaNivelInferior)} className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
          aceptaNivelInferior ? "border-[#2563EB] bg-blue-50/40" : "border-slate-200 bg-slate-50/50"
        }`}>
          <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
            aceptaNivelInferior ? "bg-[#2563EB] border-[#2563EB]" : "border-slate-300 bg-white"
          }`}>
            {aceptaNivelInferior && <svg viewBox="0 0 12 12" width="10" height="10" fill="none"><path d="M2 6l2.5 2.5L10 3.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F2744]">Acepto puestos de nivel inferior</p>
            <p className="text-xs text-slate-500">Incluiremos vacantes por debajo de tu nivel actual si hay buenas oportunidades</p>
          </div>
        </div>
      </div>

      {/* Salario mínimo */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
        <div className="pb-3 border-b border-slate-100 mb-4">
          <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider">Salario mínimo mensual</h2>
          <p className="text-xs text-slate-500 mt-1">Opcional. En pesos mexicanos (MXN).</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-500">$</span>
          <input
            type="number"
            placeholder="Ej: 20000"
            value={salarioMinimo}
            onChange={(e) => setSalarioMinimo(e.target.value)}
            className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#2563EB] transition-colors"
          />
          <span className="text-sm text-slate-500">MXN / mes</span>
        </div>
      </div>

      {/* Dónde buscar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
        <div className="pb-3 border-b border-slate-100 mb-4">
          <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider">¿Dónde buscamos? *</h2>
          <p className="text-xs text-slate-500 mt-1">Selecciona uno o más estados.</p>
        </div>

        <div onClick={toggleTodoMexico} className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all mb-4 ${
          todoMexico ? "border-[#2563EB] bg-blue-50/40" : "border-slate-200 bg-slate-50/50"
        }`}>
          <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
            todoMexico ? "bg-[#2563EB] border-[#2563EB]" : "border-slate-300 bg-white"
          }`}>
            {todoMexico && <svg viewBox="0 0 12 12" width="10" height="10" fill="none"><path d="M2 6l2.5 2.5L10 3.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </div>
          <span className="text-sm font-semibold text-[#0F2744]">Toda la República Mexicana</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {ESTADOS.map((estado) => {
            const activo = estadosSeleccionados.includes(estado);
            return (
              <button key={estado} onClick={() => toggleEstado(estado)} className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left ${
                activo ? "bg-[#2563EB] text-white border-[#2563EB]" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#2563EB]/50"
              }`}>
                {estado}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modalidad */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
        <div className="pb-3 border-b border-slate-100 mb-4">
          <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider">Modalidad de trabajo *</h2>
          <p className="text-xs text-slate-500 mt-1">Puedes elegir más de una.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MODALIDADES.map((m) => (
            <button key={m} onClick={() => toggleModalidad(m)} className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
              modalidades.includes(m) ? "bg-[#2563EB] text-white border-[#2563EB]" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#2563EB]/50"
            }`}>
              {m}
            </button>
          ))}
        </div>

        {modalidades.length > 0 && (
          <div onClick={() => setRemotoUSA(!remotoUSA)} className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all mt-4 ${
            remotoUSA ? "border-[#2563EB] bg-blue-50/40" : "border-slate-200 bg-slate-50/50"
          }`}>
            <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
              remotoUSA ? "bg-[#2563EB] border-[#2563EB]" : "border-slate-300 bg-white"
            }`}>
              {remotoUSA && <svg viewBox="0 0 12 12" width="10" height="10" fill="none"><path d="M2 6l2.5 2.5L10 3.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F2744]">¿Consideramos también vacantes en USA?</p>
              <p className="text-xs text-slate-500">Empresas de Estados Unidos que contratan talento en México</p>
            </div>
          </div>
        )}
      </div>

      {/* Botón guardar */}
      <button
        onClick={handleGuardar}
        disabled={saving || !canSave}
        className="w-full py-3.5 bg-[#2563EB] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
        style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
      >
        {saving ? "Guardando..." : `Activar ${activosCount} búsqueda(s) →`}
      </button>

      {!canSave && !saving && (
        <p className="text-xs text-center text-slate-400">
          {nivelProfesional === "" ? "Selecciona tu nivel profesional · " : ""}
          {modalidades.length === 0 ? "Selecciona al menos una modalidad · " : ""}
          {estadosSeleccionados.length === 0 ? "Selecciona al menos un estado" : ""}
        </p>
      )}
    </div>
  );
}
