"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { sileo } from "sileo";
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
  "Remoto",
  "Híbrido",
  "Presencial",
];

const TIPOS_TRABAJO = [
  "Tiempo completo",
  "Medio tiempo",
  "Freelance / Proyecto",
  "Prácticas / Becario",
];

const IDIOMAS_VACANTES = ["Español", "Inglés"];

const OPCIONES_DISPONIBILIDAD = [
  "Inmediata",
  "1 a 2 semanas",
  "Más de 1 mes",
];

const ANIOS_EXPERIENCIA = [
  "Menos de 1 año",
  "1–2 años",
  "3–5 años",
  "6–10 años",
  "Más de 10 años",
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
  const pathname = usePathname();

  const inputRef = useRef<HTMLInputElement>(null);

  // Última "foto" (en JSON) de los datos tal como están guardados en el
  // servidor. Comparamos por contenido, no por referencia, para que una
  // recarga de datos (p. ej. el doble efecto de React en desarrollo) no
  // se confunda con una edición real del usuario.
  const snapshotGuardadoRef = useRef<string | null>(null);

  // Foto de estadosDeseados/modalidadPorEstado justo antes de darle
  // "Seleccionar todo México", para poder restaurarla si el usuario le da
  // "Deseleccionar todo México" después — sin esto, deseleccionar vaciaba
  // todo sin importar lo que hubiera configurado antes.
  const preSeleccionTodoMexicoRef = useRef<{
    estados: string[];
    modalidadPorEstado: Record<string, string[]>;
  } | null>(null);

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

  const [dirty, setDirty] =
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

  const [nivelProfesional, setNivelProfesional] =
    useState("");

  const [salarioMin, setSalarioMin] =
    useState("");

  const [salarioMax, setSalarioMax] =
    useState("");

  const [remotoUSA, setRemotoUSA] =
    useState(false);

  const [aceptaNivelInferior, setAceptaNivelInferior] =
    useState(false);

  // Estado cuyo popover de "ajustar modalidad" está abierto (null = ninguno).
  const [estadoAjustando, setEstadoAjustando] =
    useState<string | null>(null);

  // Cierra el popover de modalidad si se hace clic fuera de él.
  useEffect(() => {
    if (!estadoAjustando) return;

    function handleClickFuera(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-modalidad-popover]")) {
        setEstadoAjustando(null);
      }
    }

    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, [estadoAjustando]);

  // Catálogo real de estados/municipios (buscatrabajito-catalogs), para
  // que los estados y ciudades de esta pantalla sean los mismos que usa
  // buscatrabajito-matching al buscar vacantes. Si falla la carga, se
  // cae a la lista corta de respaldo (ESTADOS).
  const [catalogoEstados, setCatalogoEstados] =
    useState<{ nombre: string; municipios: string[] }[]>([]);

  useEffect(() => {
    fetch("/api/catalogs/estados")
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (Array.isArray(d) && d.length > 0) setCatalogoEstados(d);
      })
      .catch(() => {});
  }, []);

  const nombresEstados =
    catalogoEstados.length > 0
      ? catalogoEstados.map(e => e.nombre)
      : ESTADOS;

  const municipiosPorEstado: Record<string, string[]> =
    catalogoEstados.length > 0
      ? Object.fromEntries(catalogoEstados.map(e => [e.nombre, e.municipios]))
      : {};

  const todoMexico =
    (cvData?.estadosDeseados?.length ?? 0) === nombresEstados.length;

  // Agrupa los estados seleccionados por su combinación exacta de
  // modalidad (ej. "Remoto" | "Remoto, Híbrido" | "Remoto, Híbrido,
  // Presencial"), para el tablero de un vistazo.
  const gruposModalidad: { combo: string[]; estados: string[] }[] = (() => {
    const porCombo = new Map<string, string[]>();
    for (const estado of cvData?.estadosDeseados ?? []) {
      const mods = cvData?.modalidadPorEstado?.[estado] ?? [];
      if (mods.length === 0) continue; // sin modalidad marcada: no entra a ningún grupo

      const combo = MODALIDADES.filter(m => mods.includes(m));
      const key = combo.join(" + ");
      porCombo.set(key, [...(porCombo.get(key) ?? []), estado]);
    }
    return Array.from(porCombo.entries())
      .map(([key, estados]) => ({
        combo: key.split(" + "),
        estados: estados.sort(),
      }))
      .sort((a, b) => b.estados.length - a.estados.length);
  })();

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
                  setPageStep(d.confirmado ? "view" : "wizard");
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
          cvItem.nombreCompleto &&
          cvItem.confirmado
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

          if (p.nivelProfesional) {
            setNivelProfesional(
              p.nivelProfesional as string
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
        } else if (
          Array.isArray(cvItem.puestosDeseados) &&
          cvItem.puestosDeseados.length > 0
        ) {
          // Sin perfiles guardados aún: partimos de los puestos
          // que ya se eligieron en el wizard de preferencias.
          setPerfiles(
            cvItem.puestosDeseados.map(
              (puesto: string, i: number) => ({
                puesto,
                activo: true,
                prioridad: i + 1,
              })
            )
          );
        }

        // El rango salarial vive en el propio CV (cvData.salarioDeseado),
        // que ya llena el wizard de preferencias laborales.
        const salarioMatch = (cvItem.salarioDeseado as string ?? "").match(
          /\d[\d,]*/g
        );

        if (salarioMatch) {
          setSalarioMin(salarioMatch[0]?.replace(/,/g, "") ?? "");
          setSalarioMax(salarioMatch[1]?.replace(/,/g, "") ?? "");
        }
      })
      .catch(() => {
        setPageStep("wizard");
      });
  }, []);

  // ============================================================
  // DETECTAR CAMBIOS SIN GUARDAR
  // ============================================================

  useEffect(() => {
    if (pageStep !== "view") return;

    const snapshot = JSON.stringify([
      cvData,
      perfiles,
      nivelProfesional,
      salarioMin,
      salarioMax,
      remotoUSA,
      aceptaNivelInferior,
    ]);

    if (snapshotGuardadoRef.current === null) {
      // Primera vez que tenemos datos en la pantalla "view": la tomamos
      // como línea base, no cuenta como cambio del usuario.
      snapshotGuardadoRef.current = snapshot;
      setDirty(false);
      return;
    }

    setDirty(snapshot !== snapshotGuardadoRef.current);
  }, [pageStep, cvData, perfiles, nivelProfesional, salarioMin, salarioMax, remotoUSA, aceptaNivelInferior]);

  // Avisa al cerrar/recargar la pestaña si hay cambios sin guardar.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  // Avisa al navegar a otra sección del sitio (sidebar, header, etc.)
  // si hay cambios sin guardar en esta pantalla.
  useEffect(() => {
    if (!dirty) return;

    function handleClick(e: MouseEvent) {
      const link = (e.target as HTMLElement)?.closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href === pathname) return;

      // Bloqueamos la navegación y la dejamos en manos del botón del
      // toast: los toasts no pueden pausar la ejecución como un confirm().
      e.preventDefault();
      e.stopImmediatePropagation();

      sileo.warning({
        title: "Tienes cambios sin guardar",
        description: "Si sales ahora, perderás los cambios que no has guardado.",
        button: {
          title: "Salir sin guardar",
          onClick: () => router.push(href),
        },
      });
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [dirty, pathname, router]);

  // ============================================================
  // SUBIR PDF
  // ============================================================

  async function uploadFile(file: File) {
    if (file.type !== "application/pdf") {
      return;
    }

    if (dirty) {
      sileo.warning({
        title: "Tienes cambios sin guardar",
        description:
          "Si subes un nuevo CV ahora, perderás los cambios que no has guardado.",
        button: {
          title: "Continuar de todas formas",
          onClick: () => procesarSubida(file),
        },
      });
      return;
    }

    await procesarSubida(file);
  }

  async function procesarSubida(file: File) {
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

    // Mantenemos el rango de salario local sincronizado con lo que se
    // acaba de guardar en el wizard, para que esta pantalla no se quede
    // mostrando un rango viejo.
    const salarioMatch = (data.salarioDeseado ?? "").match(/\d[\d,]*/g);
    const nuevoSalarioMin = salarioMatch?.[0]?.replace(/,/g, "") ?? "";
    const nuevoSalarioMax = salarioMatch?.[1]?.replace(/,/g, "") ?? "";
    setSalarioMin(nuevoSalarioMin);
    setSalarioMax(nuevoSalarioMax);

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
      setDirty(false);

      // Esto queda como la nueva línea base "guardada": el próximo
      // cambio real del usuario sí debe marcarse como pendiente.
      snapshotGuardadoRef.current = JSON.stringify([
        data,
        perfiles,
        nivelProfesional,
        nuevoSalarioMin,
        nuevoSalarioMax,
        remotoUSA,
        aceptaNivelInferior,
      ]);
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
          estados: cvData.estadosDeseados ?? [],
          remotoUSA,
          modalidades: cvData.modalidadDeseada ?? [],
          modalidadPorEstado: cvData.modalidadPorEstado ?? {},
          tiposTrabajo: cvData.tipoJornada ?? [],
          idiomasVacantes: cvData.idiomasVacantes ?? [],
          nivelProfesional,
          salarioMinimo: salarioMin
            ? parseInt(salarioMin)
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
    setDirty(false);

    // Nueva línea base "guardada" contra la que se compararán los
    // próximos cambios.
    snapshotGuardadoRef.current = JSON.stringify([
      cvData,
      perfiles,
      nivelProfesional,
      salarioMin,
      salarioMax,
      remotoUSA,
      aceptaNivelInferior,
    ]);

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
    const activando = !(cvData?.estadosDeseados ?? []).includes(e);

    setCvData(d => {
      if (!d) return d;

      const actuales = d.estadosDeseados ?? [];
      const seActiva = !actuales.includes(e);
      const modalidadPorEstado = { ...(d.modalidadPorEstado ?? {}) };

      if (seActiva) {
        // Estado nuevo: arranca solo en Remoto — el popover se abre solo
        // para que el usuario ajuste de una vez si quiere más.
        modalidadPorEstado[e] = ["Remoto"];
      } else {
        delete modalidadPorEstado[e];
      }

      return {
        ...d,
        estadosDeseados: seActiva
          ? [...actuales, e]
          : actuales.filter(x => x !== e),
        modalidadPorEstado,
      };
    });

    // Al activar un estado nuevo, abrimos su popover de modalidad de una
    // vez para que el usuario no tenga que buscarlo aparte.
    setEstadoAjustando(activando ? e : null);
  }

  function toggleTodoMexico() {
    setCvData(d => {
      if (!d) return d;

      if (todoMexico) {
        // Quitar todos: restaura lo que había antes de darle "Seleccionar
        // todo México" (si lo guardamos). Si no hay nada guardado (ej.
        // llegó a los 32 seleccionando uno por uno), no hay qué restaurar
        // y sí se limpia todo.
        const previo = preSeleccionTodoMexicoRef.current;
        preSeleccionTodoMexicoRef.current = null;
        return previo
          ? { ...d, estadosDeseados: previo.estados, modalidadPorEstado: previo.modalidadPorEstado }
          : { ...d, estadosDeseados: [], modalidadPorEstado: {} };
      }

      // Antes de seleccionar todos, guardamos lo que había para poder
      // restaurarlo si el usuario le da "Deseleccionar todo México" después.
      preSeleccionTodoMexicoRef.current = {
        estados: d.estadosDeseados ?? [],
        modalidadPorEstado: d.modalidadPorEstado ?? {},
      };

      // Agregar todos: los estados que ya tenían modalidad configurada
      // (personalizados a mano) la conservan tal cual; los nuevos arrancan
      // solo en Remoto.
      const modalidadPorEstado = { ...(d.modalidadPorEstado ?? {}) };
      for (const estado of nombresEstados) {
        if (!modalidadPorEstado[estado]) {
          modalidadPorEstado[estado] = ["Remoto"];
        }
      }

      return { ...d, estadosDeseados: [...nombresEstados], modalidadPorEstado };
    });
  }

  function toggleModalidadEstado(estado: string, modalidad: string) {
    setCvData(d => {
      if (!d) return d;

      const actuales = d.modalidadPorEstado?.[estado] ?? [...MODALIDADES];
      const nuevas = actuales.includes(modalidad)
        ? actuales.filter(x => x !== modalidad)
        : [...actuales, modalidad];

      return {
        ...d,
        modalidadPorEstado: { ...(d.modalidadPorEstado ?? {}), [estado]: nuevas },
      };
    });
  }

  // Freelance / Proyecto SÍ puede combinarse con modalidad: fuentes como
  // Freelancer.com son 100% remotas, así que necesitamos que el usuario
  // pueda tener "Remoto" marcado junto con "Freelance / Proyecto" para
  // que esas vacantes le aparezcan.
  function toggleTipoTrabajo(t: string) {
    setCvData(d => {
      if (!d) return d;

      const actuales = d.tipoJornada ?? [];
      const seActiva = !actuales.includes(t);

      return {
        ...d,
        tipoJornada: seActiva
          ? [...actuales, t]
          : actuales.filter(x => x !== t),
      };
    });
  }

  function toggleIdiomaVacante(idioma: string) {
    setCvData(d => {
      if (!d) return d;

      const actuales = d.idiomasVacantes ?? [];
      const seActiva = !actuales.includes(idioma);

      return {
        ...d,
        idiomasVacantes: seActiva
          ? [...actuales, idioma]
          : actuales.filter(x => x !== idioma),
      };
    });
  }

  function actualizarSalario(min: string, max: string) {
    const formatear = (raw: string) => {
      const digits = raw.replace(/\D/g, "");
      return digits ? Number(digits).toLocaleString("es-MX") : "";
    };

    const minFmt = formatear(min);
    const maxFmt = formatear(max);

    const partes = [minFmt, maxFmt].filter(Boolean).map(n => `$${n}`);
    const rango =
      partes.length === 2 ? `${partes[0]} - ${partes[1]}` : partes[0] ?? "";

    updateField("salarioDeseado", rango ? `${rango} MXN mensual` : "");
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
        <div className="max-w-6xl mx-auto space-y-6 pb-28 px-4 pt-4">

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
                  if (dirty) {
                    sileo.warning({
                      title: "Tienes cambios sin guardar",
                      description:
                        "Si abres el wizard ahora, perderás los cambios que no has guardado.",
                      button: {
                        title: "Continuar de todas formas",
                        onClick: () => setPageStep("wizard"),
                      },
                    });
                    return;
                  }

                  // No limpiamos cvData: así el wizard abre con los
                  // datos (y ediciones aún no guardadas) que ya tenías.
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
                        label: "Estado",
                        field: "estado",
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
                      {
                        label: "Años de experiencia",
                        field: "aniosExperiencia",
                      },
                    ] as {
                      label: string;
                      field: keyof CVData;
                    }[]).map(f => (

                      <div key={f.field}>

                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          {f.label}
                        </label>

                        {f.field === "estado" ? (
                          <select
                            value={(cvData.estado as string) ?? ""}
                            onChange={e =>
                              updateField("estado", e.target.value)
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
                          >
                            <option value="">Selecciona tu estado</option>
                            {nombresEstados.map(estado => (
                              <option key={estado} value={estado}>
                                {estado}
                              </option>
                            ))}
                          </select>
                        ) : f.field === "ciudad" && municipiosPorEstado[cvData.estado ?? ""]?.length ? (
                          <select
                            value={(cvData.ciudad as string) ?? ""}
                            onChange={e =>
                              updateField("ciudad", e.target.value)
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
                          >
                            <option value="">Selecciona tu ciudad</option>
                            {municipiosPorEstado[cvData.estado ?? ""].map(ciudad => (
                              <option key={ciudad} value={ciudad}>
                                {ciudad}
                              </option>
                            ))}
                          </select>
                        ) : f.field === "aniosExperiencia" ? (
                          <select
                            value={(cvData.aniosExperiencia as string) ?? ""}
                            onChange={e =>
                              updateField(
                                "aniosExperiencia",
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
                          >
                            <option value="">Selecciona un rango</option>
                            {ANIOS_EXPERIENCIA.map(anio => (
                              <option key={anio} value={anio}>
                                {anio}
                              </option>
                            ))}
                          </select>
                        ) : f.field === "telefono" ? (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0F2744] text-xs font-bold pointer-events-none">
                              +52
                            </span>
                            <input
                              type="tel"
                              inputMode="numeric"
                              value={(cvData.telefono as string) ?? ""}
                              onChange={e =>
                                updateField(
                                  "telefono",
                                  e.target.value.replace(/\D/g, "").slice(0, 10)
                                )
                              }
                              className="
                                w-full
                                pl-9
                                pr-3
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
                        ) : (
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
                        )}

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
                {/* RESUMEN PROFESIONAL                          */}
                {/* ------------------------------------------ */}

                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3">

                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Resumen Profesional
                  </h3>

                  <textarea
                    rows={5}
                    value={cvData.extractoProfesional ?? ""}
                    onChange={e =>
                      updateField(
                        "extractoProfesional",
                        e.target.value
                      )
                    }
                    placeholder="Un breve resumen de tu enfoque, logros clave y lo que buscas en tu próximo reto."
                    className="
                      w-full
                      px-3
                      py-2.5
                      bg-slate-50/50
                      border
                      border-slate-200
                      rounded-xl
                      text-xs
                      text-[#0F2744]
                      leading-relaxed
                      resize-none
                      focus:bg-white
                      focus:border-[#2563EB]
                      outline-none
                      transition-all
                    "
                  />

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

                {/* ====================================================== */}
                {/* PREFERENCIAS GEOGRÁFICAS Y MODALIDAD                    */}
                {/* ====================================================== */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">

                  {/* Header & Global Preset Action */}
                  <div className="space-y-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
                      <h3 className="text-base font-black text-[#0F2744]">
                        Ubicación y Modalidad de Trabajo
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Selecciona los estados y define qué modalidad buscas en cada uno.
                    </p>

                    <button
                      type="button"
                      onClick={toggleTodoMexico}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        todoMexico
                          ? "bg-blue-50 text-[#2563EB] border-blue-200 hover:bg-blue-100"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {todoMexico ? "Deseleccionar todo México" : "Seleccionar todo México"}
                    </button>
                  </div>

                  {/* Selector de Estados */}
                  <div className="space-y-3">
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                      Estados disponibles ({cvData.estadosDeseados?.length ?? 0} seleccionados)
                    </label>

                    <div className="flex flex-wrap gap-2.5">
                      {nombresEstados.map((estado) => {
                        const seleccionado = (cvData.estadosDeseados ?? []).includes(estado);
                        const modsActivas = cvData.modalidadPorEstado?.[estado] ?? [];
                        const estaAbierto = estadoAjustando === estado;

                        return (
                          <div key={estado} className="relative">
                            {/* Chip Principal */}
                            <button
                              type="button"
                              onClick={() => toggleEstado(estado)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                seleccionado
                                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                              }`}
                            >
                              <span>{estado}</span>
                              {seleccionado && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEstadoAjustando(estaAbierto ? null : estado);
                                  }}
                                  className="p-0.5 hover:bg-slate-700 rounded-md transition-colors"
                                >
                                  <ChevronDown className="w-3 h-3 text-slate-300" />
                                </span>
                              )}
                            </button>

                            {/* Popover / Menú pequeño para elegir Modalidades */}
                            {seleccionado && estaAbierto && (
                              <div
                                data-modalidad-popover
                                className="absolute top-full left-0 mt-2 z-30 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-3 space-y-2"
                              >
                                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                                  <span className="text-[11px] font-bold text-slate-800">
                                    Modalidad en {estado}:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEstadoAjustando(null)}
                                    className="text-[10px] text-[#2563EB] font-bold hover:underline cursor-pointer"
                                  >
                                    Listo
                                  </button>
                                </div>

                                <div className="space-y-1.5">
                                  {MODALIDADES.map((m) => {
                                    const esActiva = modsActivas.includes(m);
                                    return (
                                      <label
                                        key={m}
                                        className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors select-none"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={esActiva}
                                          onChange={() => toggleModalidadEstado(estado, m)}
                                          className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB] w-3.5 h-3.5"
                                        />
                                        {m}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cuadros Agrupados por Modalidad */}
                  {gruposModalidad.length > 0 && (
                    <div className="pt-5 border-t border-slate-100 space-y-3">
                      <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                        Distribución por Modalidad
                      </label>

                      {/* Una columna: esta tarjeta vive en la columna angosta
                          del layout de 2 columnas, no en el ancho completo
                          de la página — más de una columna aquí queda
                          apretado sin importar el breakpoint. */}
                      <div className="space-y-2.5">
                        {gruposModalidad.map((grupo) => (
                          <div
                            key={grupo.combo.join("|")}
                            className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2.5"
                          >
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 border-b border-slate-200/60 pb-2">
                              <span className="w-2 h-2 rounded-full bg-[#2563EB] flex-shrink-0" />
                              <span>{grupo.combo.join(" + ")}</span>
                              <span className="ml-auto text-[10px] font-normal text-slate-400">
                                ({grupo.estados.length})
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {grupo.estados.map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => setEstadoAjustando(st)}
                                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:border-blue-400 hover:text-[#2563EB] transition-all cursor-pointer flex items-center gap-1"
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ------------------------------------------ */}
                {/* TIPO DE EMPLEO E IDIOMA                      */}
                {/* ------------------------------------------ */}

                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">

                  <div>

                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Tipo de Empleo
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
                                (cvData.tipoJornada ?? []).includes(
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

                  <div className="pt-2 border-t border-slate-100">

                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Idioma de las Vacantes
                    </h3>

                    <div className="flex flex-wrap gap-2">

                      {IDIOMAS_VACANTES.map(
                        idioma => (

                          <button
                            key={idioma}
                            onClick={() =>
                              toggleIdiomaVacante(idioma)
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
                                (cvData.idiomasVacantes ?? []).includes(
                                  idioma
                                )
                                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"
                              }
                            `}
                          >
                            {idioma}
                          </button>

                        )
                      )}

                    </div>

                  </div>

                  <div className="pt-2 border-t border-slate-100">

                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Disponibilidad
                    </h3>

                    <div className="flex flex-wrap gap-2">

                      {OPCIONES_DISPONIBILIDAD.map(
                        o => (

                          <button
                            key={o}
                            onClick={() =>
                              updateField("disponibilidad", o)
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
                                cvData.disponibilidad === o
                                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"
                              }
                            `}
                          >
                            {o}
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

                    <div className="grid grid-cols-2 gap-2">

                      <input
                        inputMode="numeric"
                        placeholder="Desde (Ej. 25000)"
                        value={salarioMin}
                        onChange={e => {
                          const digits = e.target.value.replace(/\D/g, "");
                          setSalarioMin(digits);
                          actualizarSalario(digits, salarioMax);
                        }}
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

                      <input
                        inputMode="numeric"
                        placeholder="Hasta (Ej. 30000)"
                        value={salarioMax}
                        onChange={e => {
                          const digits = e.target.value.replace(/\D/g, "");
                          setSalarioMax(digits);
                          actualizarSalario(salarioMin, digits);
                        }}
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

                    </div>

                    {cvData.salarioDeseado && (
                      <p className="text-xs font-bold text-[#2563EB] mt-2">
                        {cvData.salarioDeseado}
                      </p>
                    )}

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

              </div>

            </div>
          )}

        </div>
      )}

      {/* ====================================================== */}
      {/* BARRA FLOTANTE DE GUARDADO                              */}
      {/* ====================================================== */}

      {pageStep === "view" && cvData && (
        <div
          className="
            fixed
            bottom-0
            left-0
            right-0
            z-40
            bg-white
            border-t
            border-slate-200
            shadow-[0_-4px_16px_rgba(15,39,68,0.08)]
            px-4
            py-3
          "
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">

            <AnimatePresence mode="wait">

              {saved ? (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  ¡Configuración guardada!
                </motion.div>
              ) : dirty ? (
                <motion.div
                  key="dirty"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-amber-600 text-xs font-bold"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Tienes cambios sin guardar
                </motion.div>
              ) : (
                <span key="empty" />
              )}

            </AnimatePresence>

            <button
              onClick={guardarTodo}
              disabled={saving}
              className="
                py-3
                px-6
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