"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  MapPin,
  Building2,
  Sparkles,
  Loader2,
  Search,
  Check,
  Copy,
  Calendar,
  Clock,
  Briefcase,
  Filter,
  Globe,
} from "lucide-react";

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
  const [cvAjustado, setCvAjustado] = useState<Record<string, string>>({});
  const [orden, setOrden] = useState<OrdenKey>("fecha_desc");
  const [agrupa, setAgrupa] = useState<AgrupaKey>("ninguno");
  const [soloRemoto, setSoloRemoto] = useState(false);

  useEffect(() => {
    fetch("/api/vacantes")
      .then((r) => r.json())
      .then((data) => {
        setVacantes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
      if (data.cv) {
        setCvAjustado((prev) => ({ ...prev, [vacante.job_id]: data.cv }));
      }
    } catch {}
    setAjustando(null);
  }

  // Filtrado por búsqueda y "solo remoto" en tiempo real
  const vacantesFiltradas = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    return vacantes.filter((v) => {
      if (soloRemoto && !esRemota(v)) return false;
      if (!term) return true;
      return (
        v.title.toLowerCase().includes(term) ||
        v.company.toLowerCase().includes(term) ||
        v.location.toLowerCase().includes(term)
      );
    });
  }, [vacantes, busqueda, soloRemoto]);

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

      {/* Estado Vacío */}
      {vacantesFiltradas.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto text-xl">
            🔍
          </div>
          <h2 className="font-extrabold text-slate-800 text-sm">No se encontraron vacantes</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {busqueda || soloRemoto
              ? "Prueba cambiando los términos de búsqueda o quitando el filtro de \"Solo remoto\"."
              : "Revisamos más de 7 portales continuamente. Las vacantes aparecerán pronto."}
          </p>
        </div>
      )}

      {/* Listado de Vacantes */}
      {grupos.map((grupo) => (
        <div key={grupo.etiqueta ?? "todas"} className="space-y-3">
          {grupo.etiqueta !== null && (
            <div className="flex items-center gap-2 px-1 pt-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <h2 className="text-xs font-black text-[#0F2744] uppercase tracking-wider">
                {grupo.etiqueta}
              </h2>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {grupo.items.length}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {grupo.items.map((vacante) => (
              <VacanteCard
                key={vacante.SK}
                vacante={vacante}
                ajustando={ajustando === vacante.job_id}
                cvAjustado={cvAjustado[vacante.job_id]}
                onAjustar={() => ajustarCV(vacante)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function VacanteCard({
  vacante,
  ajustando,
  cvAjustado,
  onAjustar,
}: {
  vacante: Vacante;
  ajustando: boolean;
  cvAjustado?: string;
  onAjustar: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const configFuente = SOURCE_CONFIG[vacante.source] ?? {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  };

  const copiarCV = () => {
    if (!cvAjustado) return;
    navigator.clipboard.writeText(cvAjustado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Inicial de la empresa para el Avatar
  const inicialEmpresa = vacante.company ? vacante.company.charAt(0).toUpperCase() : "B";

  return (
    <div className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all group">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2563EB]">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Sugerencia de adaptación de CV (IA)</span>
            </div>

            <button
              onClick={copiarCV}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-200 hover:border-blue-300 text-[#2563EB] text-[11px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              {copiado ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copiar texto
                </>
              )}
            </button>
          </div>

          <div className="p-3 bg-white border border-slate-200/60 rounded-lg text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
            {cvAjustado}
          </div>
        </div>
      )}
    </div>
  );
}