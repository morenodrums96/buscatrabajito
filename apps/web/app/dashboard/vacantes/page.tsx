"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, MapPin, Building2, Sparkles, Loader2 } from "lucide-react";

interface Vacante {
  SK: string;
  job_id: string;
  title: string;
  company: string;
  location: string;
  link: string;
  source: string;
  seen_at: number;
  posted_date?: string; // fecha real de publicación (ISO, solo día) — LinkedIn no da hora
}

const SOURCE_COLORS: Record<string, string> = {
  OCC: "bg-blue-100 text-blue-700",
  LinkedIn: "bg-sky-100 text-sky-700",
  Computrabajo: "bg-orange-100 text-orange-700",
  Bumeran: "bg-purple-100 text-purple-700",
  Remotive: "bg-green-100 text-green-700",
  WeWorkRemotely: "bg-teal-100 text-teal-700",
  Himalayas: "bg-indigo-100 text-indigo-700",
  Freelancer: "bg-amber-100 text-amber-700",
};

// Freelancer.com es un marketplace sin fronteras — casi ninguna vacante
// especifica país, así que el filtro de estados de México no aplica.
// Se marca para que quede claro por qué aparece aunque no diga México.
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

function formatFechaHora(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
  });
}

// LinkedIn solo da la fecha de publicación con precisión de día, sin hora
// (igual que muestran ellos mismos, ej. "hace 3 días").
function diasDesdePublicacion(isoDate: string): number {
  const fecha = new Date(`${isoDate}T00:00:00`);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);
  return Math.round((hoy.getTime() - fecha.getTime()) / 86400000);
}

function formatFechaPublicacion(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function textoPublicacion(isoDate: string): string {
  const dias = diasDesdePublicacion(isoDate);
  if (dias <= 0) return "Publicada hoy";
  if (dias === 1) return "Publicada hace 1 día";
  return `Publicada hace ${dias} días`;
}

// Fecha real de publicación cuando existe (LinkedIn, Freelancer.com); si
// no, cuándo la encontró el scraper — mismo criterio que usa la API.
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

const SELECT_CLASSNAME =
  "text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-[#2563EB] cursor-pointer";

export default function VacantesPage() {
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [loading, setLoading] = useState(true);
  const [ajustando, setAjustando] = useState<string | null>(null);
  const [cvAjustado, setCvAjustado] = useState<Record<string, string>>({});
  const [orden, setOrden] = useState<OrdenKey>("fecha_desc");
  const [agrupa, setAgrupa] = useState<AgrupaKey>("ninguno");

  useEffect(() => {
    fetch("/api/vacantes")
      .then(r => r.json())
      .then(data => { setVacantes(Array.isArray(data) ? data : []); setLoading(false); })
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
        setCvAjustado(prev => ({ ...prev, [vacante.job_id]: data.cv }));
      }
    } catch { }
    setAjustando(null);
  }

  // Grupos (cuando aplica): ordenados por cantidad de vacantes (más
  // primero) y, dentro de cada uno, por el criterio de orden elegido.
  const grupos = useMemo(() => {
    if (agrupa === "ninguno") {
      return [{ etiqueta: null as string | null, items: ordenarVacantes(vacantes, orden) }];
    }

    const campo = agrupa === "fuente" ? "source" : "company";
    const porGrupo = new Map<string, Vacante[]>();
    for (const v of vacantes) {
      const clave = v[campo] || "Sin especificar";
      porGrupo.set(clave, [...(porGrupo.get(clave) ?? []), v]);
    }

    return Array.from(porGrupo.entries())
      .map(([etiqueta, items]) => ({ etiqueta, items: ordenarVacantes(items, orden) }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [vacantes, orden, agrupa]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/60 space-y-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F2744] tracking-tight" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
            Vacantes encontradas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {vacantes.length > 0 ? `${vacantes.length} vacante${vacantes.length > 1 ? "s" : ""} que coinciden con tu perfil` : "Buscando vacantes para ti..."}
          </p>
        </div>

        {vacantes.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-bold text-slate-500">Ordenar por</label>
              <select
                value={orden}
                onChange={e => setOrden(e.target.value as OrdenKey)}
                className={SELECT_CLASSNAME}
              >
                {OPCIONES_ORDEN.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-bold text-slate-500">Agrupar por</label>
              <select
                value={agrupa}
                onChange={e => setAgrupa(e.target.value as AgrupaKey)}
                className={SELECT_CLASSNAME}
              >
                {OPCIONES_AGRUPA.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Sin vacantes */}
      {vacantes.length === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center shadow-xs">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="font-extrabold text-base text-[#0F2744] mb-2">Buscando vacantes para ti...</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Revisamos más de 7 portales cada 30 minutos. Las primeras vacantes aparecerán pronto.
          </p>
        </div>
      )}

      {/* Lista de vacantes (agrupada o no) */}
      {grupos.map((grupo) => (
        <div key={grupo.etiqueta ?? "todas"} className="space-y-4">
          {grupo.etiqueta !== null && (
            <div className="flex items-center gap-2 pt-2">
              <h2 className="text-sm font-extrabold text-[#0F2744]">{grupo.etiqueta}</h2>
              <span className="text-[11px] font-semibold text-slate-400">
                {grupo.items.length} vacante{grupo.items.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

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
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Título y fuente */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SOURCE_COLORS[vacante.source] ?? "bg-slate-100 text-slate-600"}`}>
              {vacante.source}
            </span>
            {FUENTES_INTERNACIONALES.has(vacante.source) && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500"
                title="Marketplace sin fronteras — no filtra por estado de México"
              >
                Internacional
              </span>
            )}
            <span className="text-[11px] text-slate-400">
              {vacante.posted_date ? (
                <>{textoPublicacion(vacante.posted_date)} · {formatFechaPublicacion(vacante.posted_date)}</>
              ) : (
                <>Encontrada {timeAgo(vacante.seen_at)} · {formatFechaHora(vacante.seen_at)}</>
              )}
            </span>
          </div>

          <h2 className="font-extrabold text-base text-[#0F2744] mb-1" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
            {vacante.title}
          </h2>

          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> {vacante.company}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {vacante.location}
            </span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <a
            href={vacante.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all"
          >
            Ver vacante <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onAjustar}
            disabled={ajustando}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-[#2563EB] text-slate-600 hover:text-[#2563EB] rounded-xl text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
          >
            {ajustando ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Ajustando...</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" /> Ajustar mi CV</>
            )}
          </button>
        </div>
      </div>

      {/* CV ajustado */}
      {cvAjustado && (
        <div className="mt-4 p-4 bg-blue-50/60 border border-blue-200/60 rounded-xl">
          <p className="text-xs font-bold text-[#2563EB] mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> CV ajustado para esta vacante
          </p>
          <pre className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
            {cvAjustado}
          </pre>
        </div>
      )}
    </div>
  );
}
