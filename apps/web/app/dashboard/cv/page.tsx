"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CVWizard, { CVData } from "@/components/CVWizard";
import CVCompletionOverlay from "@/components/CVCompletionOverlay";
import {
  Upload,
  RefreshCw,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Briefcase,
  GraduationCap,
  Globe,
  Save,
  Plus,
  User,
  MapPin,
  DollarSign,
  SlidersHorizontal,
  Layers,
  Check,
} from "lucide-react";

const NIVELES_IDIOMA = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
  "Nativo",
];

const ESTADOS = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
];

const MODALIDADES = [
  "Presencial",
  "Remoto",
  "Híbrido",
];

const TIPOS_TRABAJO = [
  "Tiempo completo",
  "Medio tiempo",
  "Contrato",
  "Prácticas",
];

const NIVELES_PROFESIONALES = [
  "Sin experiencia / Prácticas",
  "Junior (menos de 2 años)",
  "Semi-Senior (2-4 años)",
  "Senior (5+ años)",
  "Líder / Manager",
  "Director o superior",
];

interface Perfil {
  puesto: string;
  activo: boolean;
  prioridad: number;
}

type PageStep =
  | "loading"
  | "wizard"
  | "view"
  | "procesando";

export default function CVPage() {
  const router = useRouter();

  const inputRef = useRef<HTMLInputElement>(null);

  const [pageStep, setPageStep] =
    useState<PageStep>("loading");

  const [cvData, setCvData] =
    useState<CVData | null>(null);

  const [fileName, setFileName] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  /*
   * Controla la animación de finalización
   * del Wizard.
   */
  const [showCompletionOverlay, setShowCompletionOverlay] =
    useState(false);

  // Campos CV
  const [newSkill, setNewSkill] =
    useState("");

  const [expandExp, setExpandExp] =
    useState(true);

  const [expandEdu, setExpandEdu] =
    useState(true);

  // Campos búsqueda
  const [perfiles, setPerfiles] =
    useState<Perfil[]>([]);

  const [nuevoPuesto, setNuevoPuesto] =
    useState("");

  const [tiposTrabajo, setTiposTrabajo] =
    useState<string[]>(["Tiempo completo"]);

  const [nivelProfesional, setNivelProfesional] =
    useState("");

  const [salarioMinimo, setSalarioMinimo] =
    useState("");

  const [estadosSeleccionados, setEstadosSeleccionados] =
    useState<string[]>(["Nuevo León"]);

  const [modalidades, setModalidades] =
    useState<string[]>([]);

  const [remotoUSA, setRemotoUSA] =
    useState(false);

  const [aceptaNivelInferior, setAceptaNivelInferior] =
    useState(false);

  const todoMexico =
    estadosSeleccionados.length === ESTADOS.length;

  // ============================================================
  // CARGAR DATOS
  // ============================================================

  useEffect(() => {
    Promise.all([
      fetch("/api/cv/perfil").then(r => r.json()),
      fetch("/api/perfiles").then(r => r.json()),
    ])
      .then(([cvItem, perfilesItems]) => {
        if (!cvItem) {
          setPageStep("wizard");
          return;
        }

        if (cvItem.status === "processing") {
          setPageStep("procesando");

          const interval = setInterval(() => {
            fetch("/api/cv/perfil")
              .then(r => r.json())
              .then(d => {
                if (d?.status === "ready") {
                  clearInterval(interval);

                  setCvData(d);
                  setFileName("CV guardado");
                  setPageStep("view");
                } else if (d?.status === "mismatch") {
                  clearInterval(interval);

                  setCvData(d);
                  setFileName("CV guardado");
                  setPageStep("wizard");
                } else if (d?.status === "error") {
                  clearInterval(interval);
                  setPageStep("wizard");
                }
              });
          }, 3000);

          return () => clearInterval(interval);
        }

        if (
          cvItem.status === "ready" &&
          cvItem.nombreCompleto
        ) {
          setCvData(cvItem);
          setFileName("CV guardado");
          setPageStep("view");
        } else {
          setCvData(cvItem);
          setPageStep("wizard");
        }

        if (
          Array.isArray(perfilesItems) &&
          perfilesItems.length > 0
        ) {
          const p = perfilesItems[0];

          setPerfiles(
            perfilesItems.map(
              (
                item: Record<string, unknown>,
                i: number
              ) => ({
                puesto: item.puesto as string,
                activo: true,
                prioridad: i + 1,
              })
            )
          );

          if (p.estados) {
            setEstadosSeleccionados(
              p.estados as string[]
            );
          }

          if (p.modalidades) {
            setModalidades(
              p.modalidades as string[]
            );
          }

          if (p.tiposTrabajo) {
            setTiposTrabajo(
              p.tiposTrabajo as string[]
            );
          }

          if (p.nivelProfesional) {
            setNivelProfesional(
              p.nivelProfesional as string
            );
          }

          if (p.salarioMinimo) {
            setSalarioMinimo(
              String(p.salarioMinimo)
            );
          }

          if (p.remotoUSA) {
            setRemotoUSA(
              p.remotoUSA as boolean
            );
          }

          if (p.aceptaNivelInferior) {
            setAceptaNivelInferior(
              p.aceptaNivelInferior as boolean
            );
          }
        }
      })
      .catch(() => {
        setPageStep("wizard");
      });
  }, []);

  // ============================================================
  // SUBIR PDF
  // ============================================================

  async function uploadFile(file: File) {
    if (file.type !== "application/pdf") {
      return;
    }

    setFileName(file.name);
    setPageStep("procesando");

    const formData = new FormData();

    formData.append("cv", file);

    try {
      const res = await fetch(
        "/api/cv/subir",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error();
      }

      const interval = setInterval(() => {
        fetch("/api/cv/perfil")
          .then(r => r.json())
          .then(d => {
            if (d?.status === "ready") {
              clearInterval(interval);

              setCvData(d);
              setFileName(file.name);
              setPageStep("wizard");
            } else if (d?.status === "mismatch") {
              clearInterval(interval);

              setCvData(d);
              setFileName(file.name);
              setPageStep("wizard");
            } else if (d?.status === "error") {
              clearInterval(interval);
              setPageStep("view");
            }
          });
      }, 3000);
    } catch {
      setPageStep("view");
    }
  }

  // ============================================================
  // FINALIZAR WIZARD
  // ============================================================

  function handleWizardComplete(data: CVData) {
    /*
     * IMPORTANTE:
     *
     * NO cambiamos inmediatamente a "view".
     *
     * Primero:
     * 1. Guardamos los datos en memoria.
     * 2. Mostramos el overlay.
     * 3. El Wizard continúa debajo.
     *
     * Cuando el overlay termina su entrada y queda
     * completamente opaco, onCoverComplete() cambiará
     * pageStep a "view".
     */
    setCvData(data);

    setShowCompletionOverlay(true);

    /*
     * Guardamos en segundo plano mientras
     * se reproduce la animación.
     */
    setSaving(true);

    fetch("/api/cv/guardar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cvData: data,
        perfiles: [],
      }),
    }).finally(() => {
      setSaving(false);
    });
  }

  // ============================================================
  // GUARDAR TODO
  // ============================================================

  async function guardarTodo() {
    if (!cvData) {
      return;
    }

    setSaving(true);

    const activosPerfiles =
      perfiles
        .filter(p => p.activo)
        .map(p => ({
          puesto: p.puesto,
          prioridad: p.prioridad,
          estados: estadosSeleccionados,
          remotoUSA,
          modalidades,
          tiposTrabajo,
          nivelProfesional,
          salarioMinimo: salarioMinimo
            ? parseInt(salarioMinimo)
            : null,
          aceptaNivelInferior,
        }));

    await fetch("/api/cv/guardar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cvData,
        perfiles: activosPerfiles,
      }),
    });

    setSaving(false);
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  }

  // ============================================================
  // HELPERS - CV
  // ============================================================

  function updateField(
    field: keyof CVData,
    value: string
  ) {
    setCvData(d =>
      d
        ? {
            ...d,
            [field]: value,
          }
        : d
    );
  }

  function addSkill() {
    if (!newSkill.trim()) {
      return;
    }

    setCvData(d =>
      d
        ? {
            ...d,
            habilidades: [
              ...d.habilidades,
              newSkill.trim(),
            ],
          }
        : d
    );

    setNewSkill("");
  }

  function removeSkill(i: number) {
    setCvData(d =>
      d
        ? {
            ...d,
            habilidades:
              d.habilidades.filter(
                (_, idx) => idx !== i
              ),
          }
        : d
    );
  }

  function updateIdioma(
    i: number,
    field: "idioma" | "nivel",
    value: string
  ) {
    setCvData(d =>
      d
        ? {
            ...d,
            idiomas: d.idiomas.map(
              (idi, idx) =>
                idx === i
                  ? {
                      ...idi,
                      [field]: value,
                    }
                  : idi
            ),
          }
        : d
    );
  }

  function addIdioma() {
    setCvData(d =>
      d
        ? {
            ...d,
            idiomas: [
              ...d.idiomas,
              {
                idioma: "",
                nivel: "B1",
              },
            ],
          }
        : d
    );
  }

  function removeIdioma(i: number) {
    setCvData(d =>
      d
        ? {
            ...d,
            idiomas:
              d.idiomas.filter(
                (_, idx) => idx !== i
              ),
          }
        : d
    );
  }

  // ============================================================
  // HELPERS - BÚSQUEDA
  // ============================================================

  function toggleEstado(e: string) {
    setEstadosSeleccionados(prev =>
      prev.includes(e)
        ? prev.filter(x => x !== e)
        : [...prev, e]
    );
  }

  function toggleTodoMexico() {
    setEstadosSeleccionados(
      todoMexico
        ? []
        : [...ESTADOS]
    );
  }

  function toggleModalidad(m: string) {
    setModalidades(prev =>
      prev.includes(m)
        ? prev.filter(x => x !== m)
        : [...prev, m]
    );
  }

  function toggleTipoTrabajo(t: string) {
    setTiposTrabajo(prev =>
      prev.includes(t)
        ? prev.filter(x => x !== t)
        : [...prev, t]
    );
  }

  function togglePerfil(i: number) {
    setPerfiles(ps =>
      ps.map((p, idx) =>
        idx === i
          ? {
              ...p,
              activo: !p.activo,
            }
          : p
      )
    );
  }

  function removePerfil(i: number) {
    setPerfiles(ps =>
      ps.filter((_, idx) => idx !== i)
    );
  }

  function moverArriba(i: number) {
    if (i === 0) {
      return;
    }

    setPerfiles(ps => {
      const a = [...ps];

      [a[i - 1], a[i]] =
        [a[i], a[i - 1]];

      return a.map(
        (p, idx) => ({
          ...p,
          prioridad: idx + 1,
        })
      );
    });
  }

  function moverAbajo(i: number) {
    setPerfiles(ps => {
      if (i === ps.length - 1) {
        return ps;
      }

      const a = [...ps];

      [a[i], a[i + 1]] =
        [a[i + 1], a[i]];

      return a.map(
        (p, idx) => ({
          ...p,
          prioridad: idx + 1,
        })
      );
    });
  }

  function agregarPuesto() {
    if (!nuevoPuesto.trim()) {
      return;
    }

    setPerfiles(ps => [
      ...ps,
      {
        puesto: nuevoPuesto.trim(),
        activo: true,
        prioridad: ps.length + 1,
      },
    ]);

    setNuevoPuesto("");
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (pageStep === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />

        <p className="text-xs text-slate-400 font-semibold">
          Cargando información del perfil...
        </p>
      </div>
    );
  }

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================

  return (
    <>
      {/* ====================================================== */}
      {/* WIZARD                                                 */}
      {/* ====================================================== */}

      {pageStep === "wizard" && (
        <CVWizard
          initialData={
            cvData ?? undefined
          }
          onComplete={
            handleWizardComplete
          }
        />
      )}

      {/* ====================================================== */}
      {/* DASHBOARD / PROCESANDO                                  */}
      {/* ====================================================== */}

      {pageStep !== "wizard" && (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 pt-4">

          {/* ================================================== */}
          {/* HEADER                                              */}
          {/* ================================================== */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">

            <div>
              <h1 className="text-2xl font-black text-[#0F2744] tracking-tight">
                Mi CV & Preferencias de Empleo
              </h1>

              <p className="text-xs text-slate-500 mt-1">
                Gestiona tus datos personales y ajusta los parámetros de búsqueda de la IA.
              </p>
            </div>

            <div className="flex items-center gap-2">

              <button
                onClick={() => {
                  setCvData(null);
                  setFileName(null);
                  setPageStep("wizard");
                }}
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-4
                  py-2.5
                  border
                  border-slate-200
                  hover:border-slate-300
                  bg-white
                  text-slate-700
                  rounded-xl
                  text-xs
                  font-bold
                  transition-all
                  shadow-xs
                  cursor-pointer
                "
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />

                Abrir Wizard
              </button>

              <label
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-4
                  py-2.5
                  bg-[#2563EB]
                  hover:bg-blue-600
                  text-white
                  rounded-xl
                  text-xs
                  font-bold
                  transition-all
                  shadow-md
                  shadow-blue-500/20
                  cursor-pointer
                "
              >
                <Upload className="w-3.5 h-3.5" />

                Subir PDF

                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => {
                    const f =
                      e.target.files?.[0];

                    if (f) {
                      uploadFile(f);
                    }
                  }}
                />
              </label>

            </div>
          </div>

          {/* ================================================== */}
          {/* PROCESANDO PDF                                      */}
          {/* ================================================== */}

          {pageStep === "procesando" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-16 shadow-xs text-center space-y-3">

              <Loader2 className="w-10 h-10 text-[#2563EB] mx-auto animate-spin" />

              <h2 className="font-extrabold text-base text-[#0F2744]">
                Analizando documento con IA...
              </h2>

              <p className="text-xs text-slate-500">
                Estamos extrayendo tu experiencia, educación y habilidades técnicas.
              </p>

            </div>
          )}

          {/* ================================================== */}
          {/* DASHBOARD PRINCIPAL                                 */}
          {/* ================================================== */}

          {pageStep === "view" && cvData && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* ============================================== */}
              {/* COLUMNA IZQUIERDA                               */}
              {/* ============================================== */}

              <div className="lg:col-span-7 space-y-6">

                <div className="flex items-center gap-2 text-[#0F2744] font-black text-sm uppercase tracking-wider">

                  <User className="w-4 h-4 text-[#2563EB]" />

                  Información de Perfil & CV

                </div>

                {/* ------------------------------------------ */}
                {/* DATOS GENERALES                             */}
                {/* ------------------------------------------ */}

                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">

                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Datos Generales
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">

                    {([
                      {
                        label: "Nombre completo",
                        field: "nombreCompleto",
                      },
                      {
                        label: "Correo",
                        field: "email",
                      },
                      {
                        label: "Teléfono",
                        field: "telefono",
                      },
                      {
                        label: "Ciudad",
                        field: "ciudad",
                      },
                      {
                        label: "LinkedIn",
                        field: "linkedin",
                      },
                      {
                        label: "Área o Puesto Actual",
                        field: "tituloProfesional",
                      },
                    ] as {
                      label: string;
                      field: keyof CVData;
                    }[]).map(f => (

                      <div key={f.field}>

                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          {f.label}
                        </label>

                        <input
                          type="text"
                          value={
                            (cvData[
                              f.field
                            ] as string) ?? ""
                          }
                          onChange={e =>
                            updateField(
                              f.field,
                              e.target.value
                            )
                          }
                          className="
                            w-full
                            px-3
                            py-2
                            bg-slate-50/50
                            border
                            border-slate-200
                            rounded-xl
                            text-xs
                            text-[#0F2744]
                            focus:bg-white
                            focus:border-[#2563EB]
                            outline-none
                            transition-all
                          "
                        />

                      </div>

                    ))}

                  </div>

                  {/* ---------------------------------------- */}
                  {/* IDIOMAS                                    */}
                  {/* ---------------------------------------- */}

                  <div className="pt-2 border-t border-slate-100">

                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">

                      <Globe className="w-3.5 h-3.5 text-[#2563EB]" />

                      Idiomas

                    </label>

                    <div className="space-y-2">

                      {cvData.idiomas.map(
                        (idi, i) => (

                          <div
                            key={i}
                            className="flex items-center gap-2"
                          >

                            <input
                              type="text"
                              value={idi.idioma}
                              onChange={e =>
                                updateIdioma(
                                  i,
                                  "idioma",
                                  e.target.value
                                )
                              }
                              className="
                                flex-1
                                px-3
                                py-1.5
                                bg-slate-50
                                border
                                border-slate-200
                                rounded-lg
                                text-xs
                                outline-none
                                focus:bg-white
                                focus:border-[#2563EB]
                              "
                              placeholder="Idioma"
                            />

                            <select
                              value={idi.nivel}
                              onChange={e =>
                                updateIdioma(
                                  i,
                                  "nivel",
                                  e.target.value
                                )
                              }
                              className="
                                px-3
                                py-1.5
                                bg-slate-50
                                border
                                border-slate-200
                                rounded-lg
                                text-xs
                                outline-none
                                focus:bg-white
                                focus:border-[#2563EB]
                              "
                            >

                              {NIVELES_IDIOMA.map(
                                n => (
                                  <option
                                    key={n}
                                  >
                                    {n}
                                  </option>
                                )
                              )}

                            </select>

                            <button
                              onClick={() =>
                                removeIdioma(i)
                              }
                              className="
                                text-slate-400
                                hover:text-rose-500
                                p-1
                                cursor-pointer
                              "
                            >
                              <X className="w-4 h-4" />
                            </button>

                          </div>

                        )
                      )}

                      <button
                        onClick={addIdioma}
                        className="
                          inline-flex
                          items-center
                          gap-1
                          text-[#2563EB]
                          hover:text-blue-700
                          text-xs
                          font-bold
                          pt-1
                          cursor-pointer
                        "
                      >
                        + Agregar idioma
                      </button>

                    </div>

                  </div>

                </div>

                {/* ------------------------------------------ */}
                {/* HABILIDADES                                  */}
                {/* ------------------------------------------ */}

                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3">

                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Habilidades & Competencias
                  </h3>

                  <div className="flex flex-wrap gap-1.5">

                    {cvData.habilidades.map(
                      (s, i) => (

                        <span
                          key={i}
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            bg-blue-50
                            text-[#2563EB]
                            border
                            border-blue-200/60
                            px-2.5
                            py-1
                            rounded-lg
                            text-xs
                            font-semibold
                          "
                        >

                          {s}

                          <button
                            onClick={() =>
                              removeSkill(i)
                            }
                            className="
                              hover:text-rose-500
                              cursor-pointer
                            "
                          >
                            <X className="w-3 h-3" />
                          </button>

                        </span>

                      )
                    )}

                  </div>

                  <div className="flex gap-2 pt-2">

                    <input
                      type="text"
                      placeholder="Agregar habilidad (Ej. React, SQL...)"
                      value={newSkill}
                      onChange={e =>
                        setNewSkill(
                          e.target.value
                        )
                      }
                      onKeyDown={e =>
                        e.key === "Enter" &&
                        addSkill()
                      }
                      className="
                        flex-1
                        px-3
                        py-2
                        bg-slate-50
                        border
                        border-slate-200
                        rounded-xl
                        text-xs
                        outline-none
                        focus:bg-white
                        focus:border-[#2563EB]
                      "
                    />

                    <button
                      onClick={addSkill}
                      className="
                        px-4
                        py-2
                        bg-[#0F2744]
                        text-white
                        rounded-xl
                        text-xs
                        font-bold
                        cursor-pointer
                      "
                    >
                      Agregar
                    </button>

                  </div>

                </div>

                {/* ------------------------------------------ */}
                {/* EXPERIENCIA                                  */}
                {/* ------------------------------------------ */}

                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3">

                  <button
                    onClick={() =>
                      setExpandExp(
                        !expandExp
                      )
                    }
                    className="
                      w-full
                      flex
                      items-center
                      justify-between
                      cursor-pointer
                    "
                  >

                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">

                      <Briefcase className="w-3.5 h-3.5 text-[#2563EB]" />

                      Experiencia Laboral (
                      {cvData.experiencia.length}
                      )

                    </h3>

                    {expandExp ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}

                  </button>

                  {expandExp && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">

                      {cvData.experiencia.length === 0 ? (

                        <p className="text-xs text-slate-400 italic">
                          No se ha añadido experiencia laboral.
                        </p>

                      ) : (

                        cvData.experiencia.map(
                          (exp, i) => (

                            <div
                              key={i}
                              className="
                                p-3.5
                                bg-slate-50/70
                                rounded-xl
                                border
                                border-slate-200/60
                                space-y-1
                              "
                            >

                              <div className="flex justify-between items-start">

                                <span className="font-bold text-xs text-[#0F2744]">
                                  {exp.puesto}
                                </span>

                                <span className="text-[10px] font-semibold text-slate-400">
                                  {exp.fechaInicio} — {exp.fechaFin}
                                </span>

                              </div>

                              <p className="text-xs text-[#2563EB] font-semibold">
                                {exp.empresa}
                              </p>

                              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                                {exp.descripcion}
                              </p>

                            </div>

                          )
                        )

                      )}

                    </div>
                  )}

                </div>

                {/* ------------------------------------------ */}
                {/* EDUCACIÓN                                    */}
                {/* ------------------------------------------ */}

                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3">

                  <button
                    onClick={() =>
                      setExpandEdu(
                        !expandEdu
                      )
                    }
                    className="
                      w-full
                      flex
                      items-center
                      justify-between
                      cursor-pointer
                    "
                  >

                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">

                      <GraduationCap className="w-3.5 h-3.5 text-[#2563EB]" />

                      Formación Académica (
                      {cvData.educacion.length}
                      )

                    </h3>

                    {expandEdu ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}

                  </button>

                  {expandEdu && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">

                      {cvData.educacion.map(
                        (edu, i) => (

                          <div
                            key={i}
                            className="
                              p-3.5
                              bg-slate-50/70
                              rounded-xl
                              border
                              border-slate-200/60
                            "
                          >

                            <p className="font-bold text-xs text-[#0F2744]">
                              {edu.carrera}
                            </p>

                            <p className="text-xs text-slate-500">
                              {edu.institucion}
                            </p>

                            <p className="text-[10px] text-slate-400 mt-1">
                              {edu.anio}
                            </p>

                          </div>

                        )
                      )}

                    </div>
                  )}

                </div>

              </div>

              {/* ============================================== */}
              {/* COLUMNA DERECHA                                 */}
              {/* ============================================== */}

              <div className="lg:col-span-5 space-y-6">

                <div className="flex items-center gap-2 text-[#0F2744] font-black text-sm uppercase tracking-wider">

                  <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />

                  Parámetros de Búsqueda

                </div>

                {/* ------------------------------------------ */}
                {/* PUESTOS                                      */}
                {/* ------------------------------------------ */}

                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3">

                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Puestos a buscar
                  </h3>

                  <div className="space-y-2">

                    {perfiles.map(
                      (perfil, i) => (

                        <div
                          key={i}
                          className={`
                            flex
                            items-center
                            gap-2
                            p-2.5
                            rounded-xl
                            border
                            transition-all
                            ${
                              perfil.activo
                                ? "border-blue-200 bg-blue-50/30"
                                : "border-slate-200 bg-slate-50/50 opacity-60"
                            }
                          `}
                        >

                          <button
                            onClick={() =>
                              togglePerfil(i)
                            }
                            className={`
                              w-4
                              h-4
                              rounded
                              flex
                              items-center
                              justify-center
                              border
                              transition-all
                              cursor-pointer
                              ${
                                perfil.activo
                                  ? "bg-[#2563EB] border-[#2563EB]"
                                  : "border-slate-300 bg-white"
                              }
                            `}
                          >
                            {perfil.activo && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </button>

                          <span className="text-xs font-semibold flex-1 text-[#0F2744]">
                            {perfil.puesto}
                          </span>

                          <div className="flex items-center gap-1">

                            <button
                              onClick={() =>
                                moverArriba(i)
                              }
                              disabled={i === 0}
                              className="
                                p-1
                                text-slate-400
                                hover:text-[#2563EB]
                                disabled:opacity-20
                              "
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() =>
                                moverAbajo(i)
                              }
                              disabled={
                                i ===
                                perfiles.length - 1
                              }
                              className="
                                p-1
                                text-slate-400
                                hover:text-[#2563EB]
                                disabled:opacity-20
                              "
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() =>
                                removePerfil(i)
                              }
                              className="
                                p-1
                                text-slate-300
                                hover:text-[#2563EB]
                              "
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                  <div className="flex gap-2 pt-2">

                    <input
                      type="text"
                      placeholder="Agregar otro puesto..."
                      value={nuevoPuesto}
                      onChange={e =>
                        setNuevoPuesto(
                          e.target.value
                        )
                      }
                      onKeyDown={e =>
                        e.key === "Enter" &&
                        agregarPuesto()
                      }
                      className="
                        flex-1
                        px-3
                        py-2
                        bg-slate-50
                        border
                        border-slate-200
                        rounded-xl
                        text-xs
                        outline-none
                        focus:bg-white
                        focus:border-[#2563EB]
                      "
                    />

                    <button
                      onClick={
                        agregarPuesto
                      }
                      className="
                        px-3
                        py-2
                        bg-[#0F2744]
                        text-white
                        rounded-xl
                        text-xs
                        font-bold
                      "
                    >
                      +
                    </button>

                  </div>

                </div>

                {/* ------------------------------------------ */}
                {/* MODALIDAD Y CONTRATO                         */}
                {/* ------------------------------------------ */}

                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">

                  <div>

                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Modalidad de Trabajo
                    </h3>

                    <div className="flex flex-wrap gap-2">

                      {MODALIDADES.map(
                        m => (

                          <button
                            key={m}
                            onClick={() =>
                              toggleModalidad(m)
                            }
                            className={`
                              px-3
                              py-1.5
                              rounded-xl
                              text-xs
                              font-semibold
                              border
                              transition-all
                              cursor-pointer
                              ${
                                modalidades.includes(
                                  m
                                )
                                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"
                              }
                            `}
                          >
                            {m}
                          </button>

                        )
                      )}

                    </div>

                  </div>

                  <div className="pt-2 border-t border-slate-100">

                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Tipo de Contrato
                    </h3>

                    <div className="flex flex-wrap gap-2">

                      {TIPOS_TRABAJO.map(
                        t => (

                          <button
                            key={t}
                            onClick={() =>
                              toggleTipoTrabajo(t)
                            }
                            className={`
                              px-3
                              py-1.5
                              rounded-xl
                              text-xs
                              font-semibold
                              border
                              transition-all
                              cursor-pointer
                              ${
                                tiposTrabajo.includes(
                                  t
                                )
                                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"
                              }
                            `}
                          >
                            {t}
                          </button>

                        )
                      )}

                    </div>

                  </div>

                </div>

                {/* ------------------------------------------ */}
                {/* SALARIO Y NIVEL                              */}
                {/* ------------------------------------------ */}

                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">

                  <div>

                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">

                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />

                      Expectativa Salarial (Mensual)

                    </h3>

                    <div className="flex items-center gap-2">

                      <span className="text-sm font-extrabold text-slate-400">
                        $
                      </span>

                      <input
                        type="number"
                        placeholder="25000"
                        value={salarioMinimo}
                        onChange={e =>
                          setSalarioMinimo(
                            e.target.value
                          )
                        }
                        className="
                          w-full
                          px-3
                          py-2
                          bg-slate-50
                          border
                          border-slate-200
                          rounded-xl
                          text-xs
                          outline-none
                          focus:bg-white
                          focus:border-[#2563EB]
                        "
                      />

                      <span className="text-xs font-bold text-slate-400">
                        MXN
                      </span>

                    </div>

                  </div>

                  <div className="pt-2 border-t border-slate-100">

                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Nivel de Experiencia
                    </h3>

                    <select
                      value={
                        nivelProfesional
                      }
                      onChange={e =>
                        setNivelProfesional(
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        px-3
                        py-2
                        bg-slate-50
                        border
                        border-slate-200
                        rounded-xl
                        text-xs
                        outline-none
                        focus:bg-white
                        focus:border-[#2563EB]
                      "
                    >

                      <option value="">
                        Selecciona tu nivel...
                      </option>

                      {NIVELES_PROFESIONALES.map(
                        n => (
                          <option
                            key={n}
                            value={n}
                          >
                            {n}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

                {/* ------------------------------------------ */}
                {/* GUARDAR                                     */}
                {/* ------------------------------------------ */}

                <div className="space-y-2 pt-2">

                  <AnimatePresence>

                    {saved && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: -10,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                        }}
                        className="
                          flex
                          items-center
                          justify-center
                          gap-2
                          p-3
                          bg-emerald-50
                          border
                          border-emerald-200
                          rounded-xl
                          text-emerald-700
                          text-xs
                          font-bold
                        "
                      >

                        <CheckCircle2 className="w-4 h-4" />

                        ¡Configuración guardada!

                      </motion.div>
                    )}

                  </AnimatePresence>

                  <button
                    onClick={guardarTodo}
                    disabled={saving}
                    className="
                      w-full
                      py-4
                      bg-[#0F2744]
                      hover:bg-slate-800
                      text-white
                      font-bold
                      rounded-2xl
                      text-xs
                      flex
                      items-center
                      justify-center
                      gap-2
                      transition-all
                      shadow-lg
                      cursor-pointer
                      disabled:opacity-50
                    "
                  >

                    <Save className="w-4 h-4" />

                    {saving
                      ? "Guardando..."
                      : "Guardar Cambios"}

                  </button>

                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ====================================================== */}
      {/* COMPLETION OVERLAY                                     */}
      {/* ====================================================== */}

      <CVCompletionOverlay
        show={showCompletionOverlay}

        /*
         * El overlay terminó de aparecer.
         *
         * Ya está completamente opaco, por lo que
         * podemos cambiar Wizard -> Dashboard.
         *
         * El usuario todavía NO verá el dashboard.
         */
        onCoverComplete={() => {
          setPageStep("view");
        }}

        /*
         * La animación interna terminó:
         * la barra llegó al 100%.
         *
         * Ahora comienza el fade-out del overlay.
         */
        onSequenceComplete={() => {
          setShowCompletionOverlay(false);
        }}

        /*
         * Se ejecuta después de que el fade-out
         * terminó completamente.
         */
        onFinish={() => {
          // No necesitamos hacer nada aquí.
        }}
      />

    </>
  );
}