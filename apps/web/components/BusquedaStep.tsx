"use client";

import { useEffect, useState } from "react";

const ESTADOS = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima",
  "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo",
  "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca",
  "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
  "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
];

const MODALIDADES = ["Presencial", "Remoto", "Híbrido"];

interface Props {
  cvData: Record<string, unknown> | null;
  onFinish: () => void;
}

interface Perfil {
  puesto: string;
  activo: boolean;
}

export default function BusquedaStep({ cvData, onFinish }: Props) {
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nuevoPuesto, setNuevoPuesto] = useState("");
  const [saving, setSaving] = useState(false);

  // Configuración global
  const [estadosSeleccionados, setEstadosSeleccionados] = useState<string[]>(["Nuevo León"]);
  const [remotoUSA, setRemotoUSA] = useState(false);
  const [modalidades, setModalidades] = useState<string[]>([]);

  function toggleModalidad(m: string) {
    setModalidades((prev) => {
      const next = prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m];
      if (next.length === 0) setRemotoUSA(false);
      return next;
    });
  }

  useEffect(() => {
    fetch("/api/cv/sugerir-puestos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvData }),
    })
      .then((r) => r.json())
      .then((data) => {
        setPerfiles((data.puestos ?? []).map((p: string) => ({ puesto: p, activo: true })));
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

  function togglePerfil(i: number) {
    setPerfiles((ps) => ps.map((p, idx) => idx === i ? { ...p, activo: !p.activo } : p));
  }

  function agregarPuesto() {
    if (!nuevoPuesto.trim()) return;
    setPerfiles((ps) => [...ps, { puesto: nuevoPuesto.trim(), activo: true }]);
    setNuevoPuesto("");
  }

  async function handleGuardar() {
    setSaving(true);
    const activos = perfiles.filter((p) => p.activo).map((p) => ({
      puesto: p.puesto,
      estados: estadosSeleccionados,
      remotoUSA,
      modalidades,
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

  return (
    <div className="space-y-4">

      {/* Puestos */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
        <div className="pb-3 border-b border-slate-100 mb-4">
          <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider">
            Puestos a buscar
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Basándonos en tu CV sugerimos estos puestos. Activa los que te interesan o agrega los tuyos.
          </p>
        </div>

        <div className="space-y-2 mb-4">
          {perfiles.map((perfil, i) => (
            <div
              key={i}
              onClick={() => togglePerfil(i)}
              className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                perfil.activo
                  ? "border-[#2563EB] bg-blue-50/40"
                  : "border-slate-200 bg-slate-50/50 opacity-60"
              }`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                perfil.activo ? "bg-[#2563EB] border-[#2563EB]" : "border-slate-300 bg-white"
              }`}>
                {perfil.activo && (
                  <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                    <path d="M2 6l2.5 2.5L10 3.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className={`text-sm font-semibold ${perfil.activo ? "text-[#0F2744]" : "text-slate-400"}`}>
                {perfil.puesto}
              </span>
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
          <button
            onClick={agregarPuesto}
            className="px-4 py-2.5 bg-[#0F2744] text-white rounded-lg text-xs font-bold hover:bg-[#1a3a5c] transition-colors"
          >
            + Agregar
          </button>
        </div>
      </div>

      {/* Dónde buscar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
        <div className="pb-3 border-b border-slate-100 mb-4">
          <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider">
            ¿Dónde buscamos?
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Selecciona uno o más estados. Aplica para todos los puestos activos.
          </p>
        </div>

        <div
          onClick={toggleTodoMexico}
          className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all mb-4 ${
            todoMexico ? "border-[#2563EB] bg-blue-50/40" : "border-slate-200 bg-slate-50/50"
          }`}
        >
          <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
            todoMexico ? "bg-[#2563EB] border-[#2563EB]" : "border-slate-300 bg-white"
          }`}>
            {todoMexico && (
              <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                <path d="M2 6l2.5 2.5L10 3.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-sm font-semibold text-[#0F2744]">Toda la República Mexicana</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {ESTADOS.map((estado) => {
            const activo = estadosSeleccionados.includes(estado);
            return (
              <button
                key={estado}
                onClick={() => toggleEstado(estado)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left ${
                  activo
                    ? "bg-[#2563EB] text-white border-[#2563EB]"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#2563EB]/50"
                }`}
              >
                {estado}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modalidad */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
        <div className="pb-3 border-b border-slate-100 mb-4">
          <h2 className="font-extrabold text-sm text-[#0F2744] uppercase tracking-wider">
            Modalidad de trabajo
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Puedes elegir más de una. Aplica para todos los puestos activos.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MODALIDADES.map((m) => (
            <button
              key={m}
              onClick={() => toggleModalidad(m)}
              className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                modalidades.includes(m)
                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#2563EB]/50"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {modalidades.length > 0 && (
          <div
            onClick={() => setRemotoUSA(!remotoUSA)}
            className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all mt-4 ${
              remotoUSA ? "border-[#2563EB] bg-blue-50/40" : "border-slate-200 bg-slate-50/50"
            }`}
          >
            <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
              remotoUSA ? "bg-[#2563EB] border-[#2563EB]" : "border-slate-300 bg-white"
            }`}>
              {remotoUSA && (
                <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                  <path d="M2 6l2.5 2.5L10 3.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
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
        disabled={
          saving ||
          perfiles.filter((p) => p.activo).length === 0 ||
          modalidades.length === 0 ||
          estadosSeleccionados.length === 0
        }
        className="w-full py-3.5 bg-[#2563EB] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
        style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
      >
        {saving ? "Guardando..." : `Activar ${perfiles.filter((p) => p.activo).length} búsqueda(s) →`}
      </button>
    </div>
  );
}
