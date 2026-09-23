"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  MapPin,
  Building2,
  Sparkles,
  Loader2,
  Search,
  Download,
  Calendar,
  Clock,
  Briefcase,
  Filter,
  Globe,
  EyeOff,
  RotateCcw,
  Archive,
  Lightbulb,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CVAjustadoIdioma {
  resumen: string;
  tituloProfesional: string;
  pdfBase64: string;
}

interface CVAjustadoResultado {
  es: CVAjustadoIdioma;
  en: CVAjustadoIdioma;
}

function descargarPdfBase64(base64: string, filename: string) {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

interface Vacante {
  SK: string;
  job_id: string;
  title: string;
  company: string;
  location: string;
  link: string;
  source: string;
  seen_at: number;
  posted_date?: string;
  descartada?: boolean;
  motivoDescarte?: string;
}

interface Perfil {
  puesto: string;
}

const MOTIVOS_DESCARTE: { value: string; label: string }[] = [
  { value: "puesto", label: "No es mi puesto o área" },
  // Distinto de "puesto" a propósito: aquí el usuario dice que su
  // búsqueda SÍ está bien configurada, fue esta vacante en particular la
  // que se matcheó mal (falso positivo del algoritmo) — no debe sumar a
  // la sugerencia de "quita este puesto de tus búsquedas".
  { value: "vacante_incorrecta", label: "Mi búsqueda está bien, esta vacante no corresponde" },
  { value: "salario", label: "El salario no me sirve" },
  { value: "ubicacion", label: "La ubicación no me sirve" },
  { value: "otro", label: "Ya no me interesa / otro" },
];

const UMBRAL_SUGERENCIA = 3;

// Exige que coincida la MAYORÍA de las palabras del puesto, no solo una
// — con "alguna" bastaba una palabra genérica como "Engineer" para
// atribuir mal un descarte de "Mechanical Engineer" al perfil de
// "Senior Software Engineer Fullstack" (comparten "Engineer" pero nada
// más). Puestos de 1 palabra siguen necesitando esa única palabra.
function perfilCoincideConVacante(vacante: Vacante, perfil: Perfil): boolean {
  const palabras = perfil.puesto.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  if (palabras.length === 0) return false;
  const title = vacante.title.toLowerCase();
  const coincidencias = palabras.filter((w) => title.includes(w)).length;
  return coincidencias * 2 > palabras.length;
}

const SOURCE_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  OCC: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  LinkedIn: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  Computrabajo: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Bumeran: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  Remotive: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  WeWorkRemotely: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  Himalayas: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  Freelancer: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Talenteca: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

const FUENTES_INTERNACIONALES = new Set(["Freelancer"]);

type OrdenKey = "fecha_desc" | "fecha_asc" | "empresa_asc" | "empresa_desc";
type AgrupaKey = "ninguno" | "fuente" | "empresa";

const OPCIONES_ORDEN: { value: OrdenKey; label: string }[] = [
  { value: "fecha_desc", label: "Más reciente primero" },
  { value: "fecha_asc", label: "Más antigua primero" },
  { value: "empresa_asc", label: "Empresa (A-Z)" },
  { value: "empresa_desc", label: "Empresa (Z-A)" },
];

const OPCIONES_AGRUPA: { value: AgrupaKey; label: string }[] = [
  { value: "ninguno", label: "Sin agrupar" },
  { value: "fuente", label: "Plataforma" },
  { value: "empresa", label: "Empresa" },
];

function timeAgo(timestamp: number): string {
  const diff = Date.now() / 1000 - timestamp;
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return `Hace ${Math.floor(diff / 86400)} días`;
}

function formatFechaPublicacion(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
}

function diasDesdePublicacion(isoDate: string): number {
  const fecha = new Date(`${isoDate}T00:00:00`);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);
  return Math.round((hoy.getTime() - fecha.getTime()) / 86400000);
}

function textoPublicacion(isoDate: string): string {
  const dias = diasDesdePublicacion(isoDate);
  if (dias <= 0) return "Publicada hoy";
  if (dias === 1) return "Publicada hace 1 día";
  return `Hace ${dias} días`;
}

// Mismo criterio que ya usa matching.py/api/vacantes: sin un campo
// explícito de modalidad por vacante, se detecta por palabras clave en
// location o título (las fuentes 100% remotas guardan location="Remoto").
function esRemota(v: Vacante): boolean {
  const texto = `${v.location} ${v.title}`.toLowerCase();
  return ["remoto", "remote", "anywhere"].some((w) => texto.includes(w));
}

function fechaParaOrdenar(v: Vacante): number {
  if (v.posted_date) {
    const ts = new Date(`${v.posted_date}T00:00:00Z`).getTime();
    if (!Number.isNaN(ts)) return ts;
  }
  return v.seen_at * 1000;
}

function ordenarVacantes(lista: Vacante[], orden: OrdenKey): Vacante[] {
  const copia = [...lista];
  switch (orden) {
    case "fecha_desc":
      return copia.sort((a, b) => fechaParaOrdenar(b) - fechaParaOrdenar(a));
    case "fecha_asc":
      return copia.sort((a, b) => fechaParaOrdenar(a) - fechaParaOrdenar(b));
    case "empresa_asc":
      return copia.sort((a, b) => a.company.localeCompare(b.company, "es"));
    case "empresa_desc":
      return copia.sort((a, b) => b.company.localeCompare(a.company, "es"));
  }
}

export default function VacantesPage() {
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [ajustando, setAjustando] = useState<string | null>(null);
  const [cvAjustado, setCvAjustado] = useState<Record<string, CVAjustadoResultado>>({});
  const [orden, setOrden] = useState<OrdenKey>("fecha_desc");
  const [agrupa, setAgrupa] = useState<AgrupaKey>("ninguno");
  const [soloRemoto, setSoloRemoto] = useState(false);
  const [verDescartadas, setVerDescartadas] = useState(false);
  const [gruposColapsados, setGruposColapsados] = useState<Set<string>>(new Set());
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [sugerenciasOcultas, setSugerenciasOcultas] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const guardado = localStorage.getItem("vacantes_sugerencias_ocultas");
      return guardado ? new Set(JSON.parse(guardado)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    fetch("/api/vacantes")
      .then((r) => r.json())
      .then((data) => {
        setVacantes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/perfiles")
      .then((r) => r.json())
      .then((data) => setPerfiles(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function ocultarSugerencia(puesto: string) {
    setSugerenciasOcultas((prev) => {
      const next = new Set(prev).add(puesto);
      try {
        localStorage.setItem("vacantes_sugerencias_ocultas", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  // Cuenta, por perfil de búsqueda, cuántas vacantes se descartaron con
  // motivo "no es mi puesto o área" — si se pasa el umbral, se sugiere
  // (no se aplica solo) quitar ese puesto de las búsquedas.
  const sugerencias = useMemo(() => {
    const conteos = new Map<string, number>();
    for (const v of vacantes) {
      if (!v.descartada || v.motivoDescarte !== "puesto") continue;
      for (const p of perfiles) {
        if (perfilCoincideConVacante(v, p)) {
          conteos.set(p.puesto, (conteos.get(p.puesto) ?? 0) + 1);
        }
      }
    }
    return Array.from(conteos.entries())
      .filter(([puesto, n]) => n >= UMBRAL_SUGERENCIA && !sugerenciasOcultas.has(puesto))
      .map(([puesto, n]) => ({ puesto, n }));
  }, [vacantes, perfiles, sugerenciasOcultas]);

  async function ajustarCV(vacante: Vacante) {
    setAjustando(vacante.job_id);
    try {
      const res = await fetch("/api/cv/ajustar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: vacante.title,
          company: vacante.company,
          jobLocation: vacante.location,
        }),
      });
      const data = await res.json();
      if (data.es && data.en) {
        setCvAjustado((prev) => ({ ...prev, [vacante.job_id]: data as CVAjustadoResultado }));
      }
    } catch {}
    setAjustando(null);
  }

  // Optimista: actualiza local de inmediato y avisa al backend en paralelo,
  // para que ocultar/restaurar se sienta instantáneo.
  async function descartarVacante(jobId: string, descartada: boolean, motivo?: string) {
    setVacantes((prev) =>
      prev.map((v) => (v.job_id === jobId ? { ...v, descartada, motivoDescarte: motivo ?? v.motivoDescarte } : v))
    );
    try {
      await fetch("/api/vacantes/descartar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, descartada, motivo }),
      });
    } catch {}
  }

  const totalDescartadas = useMemo(() => vacantes.filter((v) => v.descartada).length, [vacantes]);

  function toggleGrupo(etiqueta: string) {
    setGruposColapsados((prev) => {
      const next = new Set(prev);
      if (next.has(etiqueta)) next.delete(etiqueta);
      else next.add(etiqueta);
      return next;
    });
  }

  // Filtrado por búsqueda, "solo remoto" y descartadas/activas en tiempo real
  const vacantesFiltradas = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    return vacantes.filter((v) => {
      if (verDescartadas ? !v.descartada : v.descartada) return false;
      if (soloRemoto && !esRemota(v)) return false;
      if (!term) return true;
      return (
        v.title.toLowerCase().includes(term) ||
        v.company.toLowerCase().includes(term) ||
        v.location.toLowerCase().includes(term)
      );
    });
  }, [vacantes, busqueda, soloRemoto, verDescartadas]);

  // Grupos ordenados
  const grupos = useMemo(() => {
    if (agrupa === "ninguno") {
      return [{ etiqueta: null as string | null, items: ordenarVacantes(vacantesFiltradas, orden) }];
    }

    const campo = agrupa === "fuente" ? "source" : "company";
    const porGrupo = new Map<string, Vacante[]>();
    for (const v of vacantesFiltradas) {
      const clave = v[campo] || "Sin especificar";
      porGrupo.set(clave, [...(porGrupo.get(clave) ?? []), v]);
    }

    return Array.from(porGrupo.entries())
      .map(([etiqueta, items]) => ({ etiqueta, items: ordenarVacantes(items, orden) }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [vacantesFiltradas, orden, agrupa]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-9 h-9 text-[#2563EB] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Cargando vacantes personalizadas...</p>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* Header con Buscador y Controles */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#0F2744] tracking-tight">
                Vacantes Coincidentes
              </h1>
              <span className="bg-blue-50 text-[#2563EB] text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
                {vacantesFiltradas.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Oportunidades encontradas automáticamente ajustadas a tu perfil.
            </p>
          </div>

          {/* Buscador Rápido */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar título, empresa o ciudad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Filtros de Ordenamiento y Agrupación */}
        {vacantes.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros y organización</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setVerDescartadas((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                  verDescartadas
                    ? "bg-blue-50 text-[#2563EB] border-blue-200"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                {verDescartadas ? "Viendo descartadas" : "Descartadas"}
                {totalDescartadas > 0 && (
                  <span className="bg-white/70 px-1.5 rounded-full text-[10px]">{totalDescartadas}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSoloRemoto((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                  soloRemoto
                    ? "bg-blue-50 text-[#2563EB] border-blue-200"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Solo remoto
              </button>

              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-bold text-slate-500">Ordenar:</label>
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value as OrdenKey)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-[#2563EB] cursor-pointer"
                >
                  {OPCIONES_ORDEN.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-bold text-slate-500">Agrupar:</label>
                <select
                  value={agrupa}
                  onChange={(e) => setAgrupa(e.target.value as AgrupaKey)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-[#2563EB] cursor-pointer"
                >
                  {OPCIONES_AGRUPA.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sugerencias basadas en descartes repetidos */}
      {sugerencias.map(({ puesto, n }) => (
        <div
          key={puesto}
          className="flex items-start sm:items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4"
        >
          <div className="flex items-start sm:items-center gap-3">
            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-xs text-amber-900">
              Descartaste <strong>{n}</strong> vacantes de <strong>&quot;{puesto}&quot;</strong> por no ser tu
              puesto o área. ¿Quieres ajustar tus búsquedas para dejar de recibirlas?
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="/dashboard/cv"
              className="inline-flex items-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all"
            >
              Editar mis búsquedas
            </a>
            <button
              type="button"
              onClick={() => ocultarSugerencia(puesto)}
              title="No volver a sugerir esto"
              className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Estado Vacío */}
      {vacantesFiltradas.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto text-xl">
            🔍
          </div>
          <h2 className="font-extrabold text-slate-800 text-sm">
            {verDescartadas
              ? "No has descartado ninguna vacante"
              : busqueda || soloRemoto
              ? "No se encontraron vacantes"
              : "Buscando vacantes para ti..."}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {verDescartadas
              ? "Las vacantes que marques como \"No me interesa\" aparecen aquí, por si quieres recuperar alguna."
              : busqueda || soloRemoto
              ? "Prueba cambiando los términos de búsqueda o quitando el filtro de \"Solo remoto\"."
              : "Revisamos más de 7 portales en cuanto guardas tu perfil — esto toma unos minutos la primera vez. Vuelve a checar en un rato."}
          </p>
        </div>
      )}

      {/* Listado de Vacantes */}
      {grupos.map((grupo) => {
        const colapsado = grupo.etiqueta !== null && gruposColapsados.has(grupo.etiqueta);
        return (
        <div key={grupo.etiqueta ?? "todas"} className="space-y-3">
          {grupo.etiqueta !== null && (
            <button
              type="button"
              onClick={() => toggleGrupo(grupo.etiqueta as string)}
              className="w-full flex items-center gap-2 px-1 pt-2 cursor-pointer group/header"
            >
              <span className="w-2 h-2 rounded-full bg-[#2563EB] flex-shrink-0" />
              <h2 className="text-xs font-black text-[#0F2744] uppercase tracking-wider group-hover/header:text-[#2563EB] transition-colors">
                {grupo.etiqueta}
              </h2>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {grupo.items.length}
              </span>
              <span className="flex-1" />
              {colapsado ? (
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover/header:text-[#2563EB] transition-colors" />
              ) : (
                <ChevronUp className="w-4 h-4 text-slate-400 group-hover/header:text-[#2563EB] transition-colors" />
              )}
            </button>
          )}

          {!colapsado && (
            <div className="space-y-3">
              {grupo.items.map((vacante) => (
                <VacanteCard
                  key={vacante.SK}
                  vacante={vacante}
                  ajustando={ajustando === vacante.job_id}
                  cvAjustado={cvAjustado[vacante.job_id]}
                  onAjustar={() => ajustarCV(vacante)}
                  onDescartar={(motivo) => descartarVacante(vacante.job_id, true, motivo)}
                  onRestaurar={() => descartarVacante(vacante.job_id, false)}
                />
              ))}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}

function VacanteCard({
  vacante,
  ajustando,
  cvAjustado,
  onAjustar,
  onDescartar,
  onRestaurar,
}: {
  vacante: Vacante;
  ajustando: boolean;
  cvAjustado?: CVAjustadoResultado;
  onAjustar: () => void;
  onDescartar: (motivo: string) => void;
  onRestaurar: () => void;
}) {
  const [mostrarPopover, setMostrarPopover] = useState(false);

  const configFuente = SOURCE_CONFIG[vacante.source] ?? {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  };

  // Inicial de la empresa para el Avatar
  const inicialEmpresa = vacante.company ? vacante.company.charAt(0).toUpperCase() : "B";

  return (
    <div
      className={`relative bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all group ${
        vacante.descartada ? "border-slate-200/60 opacity-60 hover:opacity-100" : "border-slate-200/80 hover:border-slate-300"
      }`}
    >
      <button
        type="button"
        onClick={() => setMostrarPopover((v) => !v)}
        title={vacante.descartada ? "Restaurar vacante" : "No me interesa — ocultar"}
        className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
      >
        {vacante.descartada ? <RotateCcw className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>

      {mostrarPopover && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMostrarPopover(false)} aria-hidden="true" />
          <div className="absolute top-12 right-4 z-20 w-60 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 space-y-0.5">
            {vacante.descartada ? (
              <div className="p-1.5 space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed">
                  ¿Restaurar esta vacante? Va a volver a aparecer en tu lista.
                </p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onRestaurar();
                      setMostrarPopover(false);
                    }}
                    className="flex-1 px-2 py-1.5 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Sí, restaurar
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarPopover(false)}
                    className="flex-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">¿Por qué no te interesa?</p>
                {MOTIVOS_DESCARTE.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      onDescartar(m.value);
                      setMostrarPopover(false);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    {m.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}

      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pr-8">
        
        {/* Lado Izquierdo: Logo + Info Principal */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          
          {/* Avatar Icon / Logo Placeholder */}
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/70 flex items-center justify-center text-slate-700 font-extrabold text-sm flex-shrink-0 group-hover:border-blue-200 group-hover:bg-blue-50/50 transition-colors">
            {inicialEmpresa}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            {/* Badges superiores */}
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span
                className={`font-bold px-2.5 py-0.5 rounded-md border ${configFuente.bg} ${configFuente.text} ${configFuente.border}`}
              >
                {vacante.source}
              </span>

              {FUENTES_INTERNACIONALES.has(vacante.source) && (
                <span className="font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  Global
                </span>
              )}

              <span className="text-slate-400 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3" />
                {vacante.posted_date ? (
                  <>
                    {textoPublicacion(vacante.posted_date)} ·{" "}
                    {formatFechaPublicacion(vacante.posted_date)}
                  </>
                ) : (
                  <>Detectada {timeAgo(vacante.seen_at)}</>
                )}
              </span>
            </div>

            {/* Título de la Vacante */}
            <h2 className="font-bold text-base text-[#0F2744] group-hover:text-[#2563EB] transition-colors leading-snug truncate">
              {vacante.title}
            </h2>

            {/* Empresa y Ubicación */}
            <div className="flex items-center gap-3 text-xs text-slate-600 font-medium flex-wrap pt-0.5">
              <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {vacante.company}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {vacante.location}
              </span>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Acciones (Botones) */}
        <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
          <button
            onClick={onAjustar}
            disabled={ajustando}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-blue-200 disabled:opacity-60 cursor-pointer"
          >
            {ajustando ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Optimizando...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Ajustar mi CV
              </>
            )}
          </button>

          <a
            href={vacante.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Ver vacante
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Contenedor del CV Ajustado por IA */}
      {cvAjustado && (
        <div className="mt-4 p-4 bg-gradient-to-b from-blue-50/80 to-slate-50/50 border border-blue-200/80 rounded-xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2563EB]">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>CV adaptado para esta vacante (IA) — español e inglés</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">{cvAjustado.es.resumen}</p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                descargarPdfBase64(cvAjustado.es.pdfBase64, `CV ${vacante.company} - Español.pdf`)
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar CV en Español (PDF)
            </button>

            <button
              onClick={() =>
                descargarPdfBase64(cvAjustado.en.pdfBase64, `CV ${vacante.company} - English.pdf`)
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-blue-200 text-[#2563EB] text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download CV in English (PDF)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}