"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import EmailAutocompleteInput from "@/components/EmailAutocompleteInput";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  GraduationCap,
  Languages,
  Link2,
  Mail,
  MapPin,
  Plus,
  Sparkles,
  User,
  Briefcase,
  Code2,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

export interface CVData {
  nombreCompleto: string;
  email: string;
  telefono: string;
  ciudad: string;
  linkedin: string;
  tituloProfesional: string;
  habilidades: string[];
  idiomas: { idioma: string; nivel: string }[];
  experiencia: {
    empresa: string;
    puesto: string;
    fechaInicio: string;
    fechaFin: string;
    descripcion: string;
    tipo?: string;
  }[];
  educacion: {
    institucion: string;
    carrera: string;
    anio: string;
    tipo?: string;
  }[];
  tieneExperiencia: boolean;

  /* New fields for BuscoTrabajito */
  puestosDeseados?: string[];
  modalidadDeseada?: string[];
  tipoJornada?: string[];
  disponibilidad?: string;
  estado?: string;
  estadosDeseados?: string[];
  // Modalidad (Remoto/Híbrido/Presencial) configurada por estado — permite
  // ej. "Nuevo León: las 3" pero "CDMX/Guadalajara/resto del país: solo
  // Remoto". Si un estado seleccionado no tiene entrada aquí, se usa
  // modalidadDeseada como respaldo (perfiles viejos sin esta granularidad).
  modalidadPorEstado?: Record<string, string[]>;
  salarioDeseado?: string;
  aniosExperiencia?: string;
  extractoProfesional?: string;
  idiomasVacantes?: string[];
}

interface Props {
  initialData?: Partial<CVData>;
  onComplete: (data: CVData) => void;
}

/* =========================================================
   CONSTANTS
========================================================= */

const EMPTY_CV: CVData = {
  nombreCompleto: "",
  email: "",
  telefono: "",
  ciudad: "",
  linkedin: "",
  tituloProfesional: "",
  habilidades: [],
  idiomas: [],
  experiencia: [],
  educacion: [],
  tieneExperiencia: true,
  puestosDeseados: [],
  modalidadDeseada: [],
  tipoJornada: [],
  disponibilidad: "",
  estado: "",
  estadosDeseados: [],
  modalidadPorEstado: {},
  salarioDeseado: "",
  aniosExperiencia: "",
  extractoProfesional: "",
  idiomasVacantes: [],
};

const NIVELES_IDIOMA = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
  "Nativo",
];

const SPECIALTIES = [
  "Desarrollo de software",
  "Diseño / UX",
  "Project Management",
  "Marketing",
  "Data / Analytics",
  "Administración",
];

const YEARS = [
  "Menos de 1 año",
  "1–2 años",
  "3–5 años",
  "6–10 años",
  "Más de 10 años",
];

const MODALIDADES_TRABAJO = ["Remoto", "Híbrido", "Presencial"];

const TIPOS_JORNADA = [
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

const ESTADOS_MEXICO = [
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

const CIUDADES_POR_ESTADO: Record<string, string[]> = {
  Aguascalientes: [
    "Aguascalientes",
    "Jesús María",
    "Calvillo",
    "Rincón de Romos",
    "Pabellón de Arteaga",
  ],
  "Baja California": [
    "Tijuana",
    "Mexicali",
    "Ensenada",
    "Playas de Rosarito",
    "Tecate",
  ],
  "Baja California Sur": [
    "La Paz",
    "Los Cabos",
    "Cabo San Lucas",
    "Ciudad Constitución",
    "Loreto",
  ],
  Campeche: [
    "Campeche",
    "Ciudad del Carmen",
    "Champotón",
    "Escárcega",
    "Calkiní",
  ],
  Chiapas: [
    "Tuxtla Gutiérrez",
    "San Cristóbal de las Casas",
    "Tapachula",
    "Comitán",
    "Palenque",
    "Chiapa de Corzo",
  ],
  Chihuahua: [
    "Chihuahua",
    "Ciudad Juárez",
    "Delicias",
    "Cuauhtémoc",
    "Hidalgo del Parral",
    "Nuevo Casas Grandes",
  ],
  "Ciudad de México": [
    "Álvaro Obregón",
    "Azcapotzalco",
    "Benito Juárez",
    "Coyoacán",
    "Cuauhtémoc",
    "Cuajimalpa",
    "Gustavo A. Madero",
    "Iztacalco",
    "Iztapalapa",
    "Magdalena Contreras",
    "Miguel Hidalgo",
    "Milpa Alta",
    "Tláhuac",
    "Tlalpan",
    "Venustiano Carranza",
    "Xochimilco",
  ],
  Coahuila: [
    "Saltillo",
    "Torreón",
    "Monclova",
    "Piedras Negras",
    "Ciudad Acuña",
    "Sabinas",
  ],
  Colima: ["Colima", "Manzanillo", "Tecomán", "Villa de Álvarez", "Comala"],
  Durango: [
    "Durango",
    "Gómez Palacio",
    "Lerdo",
    "Santiago Papasquiaro",
  ],
  "Estado de México": [
    "Toluca",
    "Ecatepec",
    "Naucalpan",
    "Tlalnepantla",
    "Nezahualcóyotl",
    "Chimalhuacán",
    "Cuautitlán Izcalli",
    "Atizapán de Zaragoza",
    "Metepec",
    "Texcoco",
  ],
  Guanajuato: [
    "León",
    "Guanajuato",
    "Irapuato",
    "Celaya",
    "Salamanca",
    "San Miguel de Allende",
    "Silao",
  ],
  Guerrero: [
    "Chilpancingo",
    "Acapulco",
    "Iguala",
    "Taxco",
    "Zihuatanejo",
  ],
  Hidalgo: [
    "Pachuca",
    "Tulancingo",
    "Tula de Allende",
    "Huejutla",
    "Actopan",
  ],
  Jalisco: [
    "Guadalajara",
    "Zapopan",
    "Tlaquepaque",
    "Tonalá",
    "Puerto Vallarta",
    "Tepatitlán",
    "Lagos de Moreno",
  ],
  Michoacán: [
    "Morelia",
    "Uruapan",
    "Zamora",
    "Lázaro Cárdenas",
    "Pátzcuaro",
  ],
  Morelos: ["Cuernavaca", "Jiutepec", "Cuautla", "Temixco", "Yautepec"],
  Nayarit: [
    "Tepic",
    "Bahía de Banderas",
    "Santiago Ixcuintla",
    "Compostela",
  ],
  "Nuevo León": [
    "Monterrey",
    "San Pedro Garza García",
    "Guadalupe",
    "San Nicolás de los Garza",
    "Apodaca",
    "Santa Catarina",
    "General Escobedo",
    "García",
  ],
  Oaxaca: [
    "Oaxaca de Juárez",
    "Salina Cruz",
    "Tuxtepec",
    "Huajuapan de León",
    "Juchitán",
  ],
  Puebla: [
    "Puebla",
    "Tehuacán",
    "San Martín Texmelucan",
    "Atlixco",
    "San Andrés Cholula",
  ],
  Querétaro: [
    "Querétaro",
    "San Juan del Río",
    "Corregidora",
    "El Marqués",
  ],
  "Quintana Roo": [
    "Cancún",
    "Playa del Carmen",
    "Chetumal",
    "Cozumel",
    "Tulum",
  ],
  "San Luis Potosí": [
    "San Luis Potosí",
    "Soledad de Graciano Sánchez",
    "Ciudad Valles",
    "Matehuala",
  ],
  Sinaloa: ["Culiacán", "Mazatlán", "Los Mochis", "Guasave"],
  Sonora: [
    "Hermosillo",
    "Ciudad Obregón",
    "Nogales",
    "San Luis Río Colorado",
    "Navojoa",
  ],
  Tabasco: ["Villahermosa", "Cárdenas", "Comalcalco", "Macuspana"],
  Tamaulipas: [
    "Reynosa",
    "Matamoros",
    "Nuevo Laredo",
    "Tampico",
    "Ciudad Victoria",
    "Ciudad Madero",
  ],
  Tlaxcala: ["Tlaxcala", "Apizaco", "Huamantla", "Chiautempan"],
  Veracruz: [
    "Veracruz",
    "Xalapa",
    "Coatzacoalcos",
    "Poza Rica",
    "Córdoba",
    "Orizaba",
    "Boca del Río",
  ],
  Yucatán: ["Mérida", "Valladolid", "Progreso", "Tizimín"],
  Zacatecas: ["Zacatecas", "Fresnillo", "Guadalupe", "Jerez"],
};

const TIPOS_FORMACION = [
  "Carrera / Grado",
  "Certificación / Curso",
  "Diplomado / Posgrado",
];

const PLACEHOLDERS_FORMACION: Record<
  string,
  { institucion: string; carrera: string }
> = {
  "Carrera / Grado": {
    institucion: "Ej. Universidad Autónoma de Nuevo León",
    carrera: "Ej. Licenciatura en Ciencias de la Computación",
  },
  "Certificación / Curso": {
    institucion: "Ej. AWS / Google / Platzi / Udemy",
    carrera: "Ej. AWS Certified Solutions Architect",
  },
  "Diplomado / Posgrado": {
    institucion: "Ej. Tecnológico de Monterrey",
    carrera: "Ej. Maestría en Desarrollo de Software",
  },
};

const TARGET_ROLES = [
  "Software Developer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Technical Lead",
  "Software Architect",
  "Project Manager",
  "UX/UI Designer",
  "Data Analyst",
  "Engineering Manager",
];

// Categorías que se sugieren automáticamente si se detectan palabras clave
// relacionadas en las habilidades, puestos o descripciones del CV.
const CATEGORIAS_SUGERIDAS: { categoria: string; palabras: string[] }[] = [
  { categoria: "Arquitectura de Software", palabras: ["arquitect", "architect"] },
  { categoria: "Liderazgo Técnico", palabras: ["liderazgo", "lider", "lead", "manager", "gerente"] },
  { categoria: "Cloud / DevOps", palabras: ["aws", "azure", "gcp", "cloud", "nube", "docker", "kubernetes", "devops", "terraform"] },
  { categoria: "Inteligencia Artificial", palabras: ["inteligencia artificial", "machine learning"] },
  { categoria: "Bases de Datos", palabras: ["postgres", "mysql", "sql server", "base de datos", "database"] },
];

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Deriva las especialidades/puestos sugeridos a partir del CV: primero los
// puestos reales de la experiencia, luego el título profesional, y por
// último categorías detectadas por palabras clave en habilidades/experiencia.
function derivarEspecialidadesDelCV(cv?: Partial<CVData>): string[] {
  const vistos = new Set<string>();
  const opciones: string[] = [];

  function agregar(item?: string) {
    const limpio = item?.trim();
    if (limpio && !vistos.has(limpio)) {
      vistos.add(limpio);
      opciones.push(limpio);
    }
  }

  (cv?.experiencia ?? []).forEach((exp) => agregar(exp.puesto));
  agregar(cv?.tituloProfesional);

  const textoCompleto = normalizarTexto(
    [
      cv?.tituloProfesional ?? "",
      ...(cv?.habilidades ?? []),
      ...(cv?.experiencia ?? []).map(
        (e) => `${e.puesto ?? ""} ${e.descripcion ?? ""}`
      ),
    ].join(" ")
  );

  CATEGORIAS_SUGERIDAS.forEach(({ categoria, palabras }) => {
    if (palabras.some((p) => textoCompleto.includes(p))) {
      agregar(categoria);
    }
  });

  return opciones;
}

// Catálogo semilla: se mezcla con las sugerencias mientras el catálogo
// global (alimentado por los CVs de los usuarios) todavía es chico. No se
// muestra como categorías fijas en la pantalla — la pregunta es genérica
// para cualquier profesión, esto solo ayuda al autocompletado desde el día uno.
const CATALOGO_SEMILLA: { categoria: string; items: string[] }[] = [
  {
    categoria: "Backend",
    items: [
      "Java",
      "Spring Boot",
      "Spring Security",
      "Spring Data",
      "Node.js",
      "TypeScript",
      "Python",
      "REST APIs",
      "Microservices",
      "GraphQL",
      ".NET / C#",
    ],
  },
  {
    categoria: "Frontend",
    items: [
      "React",
      "Next.js",
      "Angular",
      "Vue",
      "JavaScript",
      "TypeScript",
      "Tailwind CSS",
      "Figma",
    ],
  },
  {
    categoria: "Bases de datos",
    items: [
      "PostgreSQL",
      "MySQL",
      "MongoDB",
      "SQL Server",
      "Amazon RDS",
      "Redis",
    ],
  },
  {
    categoria: "Cloud & DevOps",
    items: [
      "AWS",
      "Azure",
      "GCP",
      "Docker",
      "Kubernetes",
      "CI/CD",
      "Jenkins",
      "Git",
      "Nginx",
      "Terraform",
    ],
  },
  {
    categoria: "Observabilidad",
    items: [
      "Logging",
      "Monitoring",
      "Alerting",
      "Incident management",
      "Postmortems",
    ],
  },
  {
    categoria: "Herramientas de IA",
    items: [
      "Claude",
      "ChatGPT",
      "AI-assisted development",
      "Prompt engineering",
    ],
  },
  {
    categoria: "Metodologías",
    items: [
      "Scrum",
      "Kanban",
      "Sprint planning",
      "Backlog refinement",
      "Retrospectives",
      "OKRs / KPIs",
    ],
  },
];

/* =========================================================
   ANIMATION
========================================================= */

const questionVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 35 : -35,
    opacity: 0,
  }),

  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },

  exit: (direction: number) => ({
    x: direction < 0 ? 35 : -35,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  }),
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AIProfileBuilder({
  initialData,
  onComplete,
}: Props) {
  const [data, setData] = useState<CVData>(() => {
    const base: CVData = { ...EMPTY_CV, ...initialData };

    // Si el teléfono ya venía guardado con el +52 incluido (ej. de un CV
    // extraído antes), lo normalizamos a solo los últimos 10 dígitos, ya
    // que el campo siempre muestra el +52 como prefijo fijo por separado.
    base.telefono = base.telefono.replace(/\D/g, "").slice(-10);

    // Si aún no hay especialidades elegidas, preseleccionamos las que se
    // detectan en el CV para que el usuario solo tenga que confirmarlas.
    if ((base.puestosDeseados ?? []).length === 0) {
      const delCV = derivarEspecialidadesDelCV(initialData);
      base.puestosDeseados = delCV;
      if (!base.tituloProfesional && delCV[0]) {
        base.tituloProfesional = delCV[0];
      }
    }

    return base;
  });

  const [question, setQuestion] = useState(0);
  const [direction, setDirection] = useState(1);

  const [otraEspecialidad, setOtraEspecialidad] = useState("");

  const [salarioMin, setSalarioMin] = useState(() => {
    const match = (initialData?.salarioDeseado ?? "").match(/\d[\d,]*/g);
    return match?.[0]?.replace(/,/g, "") ?? "";
  });
  const [salarioMax, setSalarioMax] = useState(() => {
    const match = (initialData?.salarioDeseado ?? "").match(/\d[\d,]*/g);
    return match?.[1]?.replace(/,/g, "") ?? "";
  });

  // Especialidades/puestos detectados directamente en el CV: puestos reales
  // de la experiencia, título profesional y categorías por palabras clave
  // (arquitectura, liderazgo, cloud, etc.).
  const especialidadesDelCV = useMemo(
    () => derivarEspecialidadesDelCV(initialData),
    [initialData]
  );

  // Catálogo genérico de respaldo, sin repetir lo que ya salió del CV.
  const especialidadesCatalogo = useMemo(() => {
    const yaCubiertas = new Set(especialidadesDelCV);
    return [...SPECIALTIES, ...TARGET_ROLES].filter(
      (item) => !yaCubiertas.has(item)
    );
  }, [especialidadesDelCV]);

  const [newSkill, setNewSkill] = useState("");
  const [catalogoHabilidades, setCatalogoHabilidades] = useState<string[]>([]);

  // Catálogo global de habilidades (de todos los CVs procesados), mezclado
  // con la semilla de respaldo, para sugerir autocompletado sin importar la
  // profesión de quien lo llena.
  useEffect(() => {
    const semilla = CATALOGO_SEMILLA.flatMap((c) => c.items);

    fetch("/api/skills")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const delServidor = Array.isArray(d?.habilidades)
          ? (d.habilidades as string[])
          : [];

        const vistos = new Set<string>();
        const combinado: string[] = [];
        for (const item of [...delServidor, ...semilla]) {
          const clave = item.toLowerCase();
          if (!vistos.has(clave)) {
            vistos.add(clave);
            combinado.push(item);
          }
        }

        setCatalogoHabilidades(combinado);
      })
      .catch(() => setCatalogoHabilidades(semilla));
  }, []);

  // Catálogo real de estados/municipios (buscatrabajito-catalogs), para que
  // los estados y ciudades que se muestran aquí sean los mismos que usa
  // buscatrabajito-matching al buscar vacantes. Si falla la carga, se cae
  // a las listas cortas de respaldo (ESTADOS_MEXICO / CIUDADES_POR_ESTADO).
  const [catalogoEstados, setCatalogoEstados] = useState<
    { nombre: string; municipios: string[] }[]
  >([]);

  useEffect(() => {
    fetch("/api/catalogs/estados")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) setCatalogoEstados(d);
      })
      .catch(() => {});
  }, []);

  const nombresEstados = useMemo(
    () =>
      catalogoEstados.length > 0
        ? catalogoEstados.map((e) => e.nombre)
        : ESTADOS_MEXICO,
    [catalogoEstados]
  );

  const municipiosPorEstado = useMemo(() => {
    if (catalogoEstados.length === 0) return CIUDADES_POR_ESTADO;
    const mapa: Record<string, string[]> = {};
    for (const e of catalogoEstados) mapa[e.nombre] = e.municipios;
    return mapa;
  }, [catalogoEstados]);

  const sugerenciasHabilidad = useMemo(() => {
    const texto = newSkill.trim().toLowerCase();
    if (!texto) return [];

    const yaAgregadas = new Set(
      data.habilidades.map((h) => h.toLowerCase())
    );

    return catalogoHabilidades
      .filter(
        (h) =>
          h.toLowerCase().includes(texto) &&
          !yaAgregadas.has(h.toLowerCase())
      )
      .slice(0, 8);
  }, [newSkill, catalogoHabilidades, data.habilidades]);

  const [newExperience, setNewExperience] = useState({
    empresa: "",
    puesto: "",
    fechaInicio: "",
    fechaFin: "",
    descripcion: "",
    tipo: "Empleo",
  });
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<
    number | null
  >(null);
  const [experienciaOriginalAlEditar, setExperienciaOriginalAlEditar] =
    useState<typeof newExperience | null>(null);

  const [newEducation, setNewEducation] = useState({
    institucion: "",
    carrera: "",
    anio: "",
    tipo: TIPOS_FORMACION[0],
  });

  const [newLanguage, setNewLanguage] = useState({
    idioma: "",
    nivel: "B1",
  });

  const [generandoResumen, setGenerandoResumen] = useState(false);

  // Auto-capitalizar la primera letra una sola vez: si el usuario borra esa
  // mayúscula y vuelve a escribir en minúscula, ya no se vuelve a forzar.
  const nombreCapRef = useRef(false);

  function handleNombreCompletoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    let nuevo = val;

    if (!nombreCapRef.current && data.nombreCompleto === "" && val.length > 0) {
      nombreCapRef.current = true;
      nuevo = val.charAt(0).toUpperCase() + val.slice(1);
    }

    updateData("nombreCompleto", nuevo);
  }

  /*
   * Total logical questions.
   *
   * The UI changes depending on the current question.
   */
  const TOTAL_QUESTIONS = 9;

  const progress = Math.round(
    Math.min(((question + 1) / TOTAL_QUESTIONS) * 100, 100)
  );

  // Reglas de negocio: en la pregunta 0 el nombre completo es obligatorio.
  // En la pregunta 1, correo y teléfono son obligatorios.
  const canContinue = useMemo(() => {
    if (question === 0) {
      return data.nombreCompleto.trim() !== "";
    }

    if (question === 1) {
      return (
        data.email.trim() !== "" &&
        data.telefono.trim().length === 10
      );
    }

    return true;
  }, [question, data.nombreCompleto, data.email, data.telefono]);

  /* =========================================================
     HELPERS
  ========================================================= */

  function updateData<K extends keyof CVData>(
    key: K,
    value: CVData[K]
  ) {
    setData((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function nextQuestion() {
    if (!canContinue) return;

    setDirection(1);

    if (question < TOTAL_QUESTIONS - 1) {
      setQuestion((current) => current + 1);
    } else {
      onComplete(data);
    }
  }

  function previousQuestion() {
    setDirection(-1);

    if (question > 0) {
      setQuestion((current) => current - 1);
    }
  }

  function toggleEspecialidad(item: string) {
    const actuales = data.puestosDeseados ?? [];
    const nuevos = actuales.includes(item)
      ? actuales.filter((x) => x !== item)
      : [...actuales, item];

    setData((current) => ({
      ...current,
      puestosDeseados: nuevos,
      // El primero seleccionado se usa como título profesional principal.
      tituloProfesional: nuevos[0] ?? "",
    }));
  }

  function toggleEnLista(
    field: "modalidadDeseada" | "estadosDeseados" | "idiomasVacantes",
    item: string
  ) {
    const actuales = data[field] ?? [];
    const nuevos = actuales.includes(item)
      ? actuales.filter((x) => x !== item)
      : [...actuales, item];

    updateData(field, nuevos);
  }

  function toggleTodosLosEstados() {
    const todosSeleccionados =
      (data.estadosDeseados ?? []).length === nombresEstados.length;

    updateData("estadosDeseados", todosSeleccionados ? [] : [...nombresEstados]);
  }

  // Freelance / Proyecto SÍ puede combinarse con modalidad: fuentes como
  // Freelancer.com son 100% remotas, así que necesitamos que el usuario
  // pueda tener "Remoto" marcado junto con "Freelance / Proyecto" para
  // que esas vacantes le aparezcan.
  function toggleTipoJornada(tipo: string) {
    const actuales = data.tipoJornada ?? [];
    const nuevos = actuales.includes(tipo)
      ? actuales.filter((x) => x !== tipo)
      : [...actuales, tipo];

    updateData("tipoJornada", nuevos);
  }

  function formatMiles(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    return Number(digits).toLocaleString("es-MX");
  }

  function actualizarSalario(min: string, max: string) {
    const minFmt = formatMiles(min);
    const maxFmt = formatMiles(max);

    const partes = [minFmt, maxFmt].filter(Boolean).map((n) => `$${n}`);
    const rango =
      partes.length === 2 ? `${partes[0]} - ${partes[1]}` : partes[0] ?? "";

    updateData("salarioDeseado", rango ? `${rango} MXN mensual` : "");
  }


  async function generarResumenConIA() {
    setGenerandoResumen(true);

    try {
      const res = await fetch("/api/cv/generar-resumen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCompleto: data.nombreCompleto,
          tituloProfesional: data.tituloProfesional,
          aniosExperiencia: data.aniosExperiencia,
          habilidades: data.habilidades,
          experiencia: data.experiencia,
          puestosDeseados: data.puestosDeseados,
        }),
      });

      if (!res.ok) throw new Error("No se pudo generar el resumen");

      const { resumen } = await res.json();
      if (resumen) updateData("extractoProfesional", resumen);
    } catch (err) {
      console.warn(err);
    } finally {
      setGenerandoResumen(false);
    }
  }

  function addSkill(skill?: string) {
    const value = (skill ?? newSkill).trim();

    if (!value) return;

    if (
      !data.habilidades.some(
        (item) => item.toLowerCase() === value.toLowerCase()
      )
    ) {
      updateData("habilidades", [...data.habilidades, value]);
    }

    setNewSkill("");
  }

  function removeSkill(index: number) {
    updateData(
      "habilidades",
      data.habilidades.filter((_, i) => i !== index)
    );
  }

  // Mientras se edita una experiencia ya agregada, cada cambio se guarda de
  // inmediato en data.experiencia (no solo en el borrador local) — así, si
  // el usuario navega a otra pregunta sin darle a "Guardar cambios", el
  // cambio no se pierde.
  function updateNewExperienceField<K extends keyof typeof newExperience>(
    field: K,
    value: (typeof newExperience)[K]
  ) {
    const actualizado = { ...newExperience, [field]: value };
    setNewExperience(actualizado);

    if (editingExperienceIndex !== null) {
      setData((current) => ({
        ...current,
        experiencia: current.experiencia.map((exp, i) =>
          i === editingExperienceIndex ? actualizado : exp
        ),
      }));
    }
  }

  function limpiarBorradorExperiencia() {
    setNewExperience({
      empresa: "",
      puesto: "",
      fechaInicio: "",
      fechaFin: "",
      descripcion: "",
      tipo: "Empleo",
    });
  }

  function addExperience() {
    if (!newExperience.empresa.trim()) return;
    if (!newExperience.puesto.trim()) return;

    if (editingExperienceIndex !== null) {
      // Los cambios ya se guardaron en vivo con cada edición; solo salimos
      // del modo edición.
      setEditingExperienceIndex(null);
      setExperienciaOriginalAlEditar(null);
    } else {
      updateData("experiencia", [
        ...data.experiencia,
        newExperience,
      ]);
    }

    limpiarBorradorExperiencia();
  }

  function startEditExperience(index: number) {
    const exp = data.experiencia[index];
    const copia = {
      empresa: exp.empresa,
      puesto: exp.puesto,
      fechaInicio: exp.fechaInicio,
      fechaFin: exp.fechaFin,
      descripcion: exp.descripcion,
      tipo: exp.tipo ?? "Empleo",
    };
    setNewExperience(copia);
    setExperienciaOriginalAlEditar(copia);
    setEditingExperienceIndex(index);
  }

  function cancelEditExperience() {
    // Revertimos al estado original antes de empezar a editar, ya que los
    // cambios se fueron guardando en vivo.
    if (editingExperienceIndex !== null && experienciaOriginalAlEditar) {
      const index = editingExperienceIndex;
      const original = experienciaOriginalAlEditar;
      setData((current) => ({
        ...current,
        experiencia: current.experiencia.map((exp, i) =>
          i === index ? original : exp
        ),
      }));
    }

    setEditingExperienceIndex(null);
    setExperienciaOriginalAlEditar(null);
    limpiarBorradorExperiencia();
  }

  function removeExperience(index: number) {
    updateData(
      "experiencia",
      data.experiencia.filter((_, i) => i !== index)
    );

    if (editingExperienceIndex === index) {
      setEditingExperienceIndex(null);
      setExperienciaOriginalAlEditar(null);
      limpiarBorradorExperiencia();
    }
  }

  function addEducation() {
    if (!newEducation.institucion.trim()) return;
    if (!newEducation.carrera.trim()) return;

    updateData("educacion", [
      ...data.educacion,
      newEducation,
    ]);

    // Mantenemos el tipo seleccionado por si agrega varias del mismo tipo.
    setNewEducation({
      institucion: "",
      carrera: "",
      anio: "",
      tipo: newEducation.tipo,
    });
  }

  function removeEducation(index: number) {
    updateData(
      "educacion",
      data.educacion.filter((_, i) => i !== index)
    );
  }

  function addLanguage() {
    if (!newLanguage.idioma.trim()) return;

    updateData("idiomas", [
      ...data.idiomas,
      newLanguage,
    ]);

    setNewLanguage({
      idioma: "",
      nivel: "B1",
    });
  }

  function removeLanguage(index: number) {
    updateData(
      "idiomas",
      data.idiomas.filter((_, i) => i !== index)
    );
  }

  /* =========================================================
     PROFILE COMPLETENESS
  ========================================================= */

  const profileStats = useMemo(() => {
    let completed = 0;
    const total = 7;

    if (data.nombreCompleto) completed++;
    if (data.email) completed++;
    if (data.tituloProfesional) completed++;
    if (data.habilidades.length > 0) completed++;
    if (data.experiencia.length > 0) completed++;
    if (data.educacion.length > 0) completed++;
    if (data.idiomas.length > 0) completed++;

    return Math.round((completed / total) * 100);
  }, [data]);

  /* =========================================================
     QUESTION CONTENT
  ========================================================= */

  function renderQuestion() {
    switch (question) {
      /* -----------------------------------------------------
         0 — NAME
      ----------------------------------------------------- */

      case 0:
        return (
          <QuestionLayout
            eyebrow="Empecemos"
            title="¿Cómo te llamas?"
            description="Primero vamos a crear la base de tu perfil profesional."
          >
            <div className="space-y-3">
              <label className="block mb-[7px] text-[#475569] text-[11px] font-extrabold uppercase tracking-[0.08em]">
                Nombre completo *
              </label>

              <input
                autoFocus
                value={data.nombreCompleto}
                onChange={handleNombreCompletoChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") nextQuestion();
                }}
                placeholder="Ej. Javier Moreno"
                className="w-full min-h-[52px] px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] outline-none text-[#1e3a5f] text-[15px] transition-all placeholder:text-[#94a3b8] focus:bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
              />
            </div>
          </QuestionLayout>
        );

      /* -----------------------------------------------------
         1 — EMAIL
      ----------------------------------------------------- */

      case 1:
        return (
          <QuestionLayout
            eyebrow="Contacto"
            title="¿Dónde podemos contactarte?"
            description="Usaremos esta información para enviarte oportunidades."
          >
            <div className="space-y-4">
              <div>
                <label className="block mb-[7px] text-[#475569] text-[11px] font-extrabold uppercase tracking-[0.08em]">
                  Correo electrónico *
                </label>

                <EmailAutocompleteInput
                  autoFocus
                  value={data.email}
                  onChange={(value) =>
                    updateData("email", value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") nextQuestion();
                  }}
                  placeholder="tu@email.com"
                  className="w-full min-h-[52px] px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] outline-none text-[#1e3a5f] text-[15px] transition-all placeholder:text-[#94a3b8] focus:bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
                />
              </div>

              <div>
                <label className="block mb-[7px] text-[#475569] text-[11px] font-extrabold uppercase tracking-[0.08em]">
                  Número de teléfono *
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1e3a5f] text-[15px] font-semibold pointer-events-none">
                    +52
                  </span>

                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={data.telefono}
                    onChange={(e) => {
                      const digitos = e.target.value.replace(/\D/g, "");
                      updateData("telefono", digitos.slice(-10));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") nextQuestion();
                    }}
                    placeholder="8112345678"
                    className="w-full min-h-[52px] pl-12 pr-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] outline-none text-[#1e3a5f] text-[15px] transition-all placeholder:text-[#94a3b8] focus:bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
                  />
                </div>
              </div>
            </div>
          </QuestionLayout>
        );

      /* -----------------------------------------------------
         2 — EXPERIENCE
      ----------------------------------------------------- */

      case 2:
        return (
          <QuestionLayout
            eyebrow="Experiencia laboral"
            title="¿Cuál es tu trayectoria profesional?"
            description="Selecciona tus años de experiencia total y agrega los empleos o proyectos más relevantes que has tenido."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500">
                  ¿Cuántos años de experiencia tienes en total?
                </p>
                <div className="flex flex-wrap gap-2">
                  {YEARS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        updateData("aniosExperiencia", item)
                      }
                      className={`min-h-[40px] px-3.5 rounded-full text-xs font-bold border transition-all ${
                        data.aniosExperiencia === item
                          ? "border-[#2563eb] bg-[#eff6ff] text-[#1e3a5f]"
                          : "border-[#e2e8f0] bg-white text-slate-500 hover:border-[#93c5fd]"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 flex flex-col gap-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">
                    {editingExperienceIndex !== null
                      ? "Editando experiencia"
                      : "Agregar puesto o proyecto"}
                  </span>
                  {editingExperienceIndex !== null && (
                    <button
                      type="button"
                      onClick={cancelEditExperience}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-600"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  {["Empleo", "Freelance / Proyecto"].map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() =>
                        updateNewExperienceField("tipo", tipo)
                      }
                      className={`min-h-[36px] px-3 rounded-[10px] text-xs font-bold border transition-all ${
                        newExperience.tipo === tipo
                          ? "border-[#2563eb] bg-[#eff6ff] text-[#1e3a5f]"
                          : "border-[#e2e8f0] bg-white text-slate-500 hover:border-[#93c5fd]"
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    placeholder="Empresa / Cliente"
                    value={newExperience.empresa}
                    onChange={(e) =>
                      updateNewExperienceField("empresa", e.target.value)
                    }
                    className="w-full min-h-[44px] px-3 bg-white border border-[#e2e8f0] rounded-[11px] outline-none text-[#1e3a5f] text-[13px] transition-all focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)]"
                  />

                  <input
                    placeholder="Puesto / Rol"
                    value={newExperience.puesto}
                    onChange={(e) =>
                      updateNewExperienceField("puesto", e.target.value)
                    }
                    className="w-full min-h-[44px] px-3 bg-white border border-[#e2e8f0] rounded-[11px] outline-none text-[#1e3a5f] text-[13px] transition-all focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)]"
                  />

                  <input
                    placeholder="Inicio · Ej. Ene 2022"
                    value={newExperience.fechaInicio}
                    onChange={(e) =>
                      updateNewExperienceField("fechaInicio", e.target.value)
                    }
                    className="w-full min-h-[44px] px-3 bg-white border border-[#e2e8f0] rounded-[11px] outline-none text-[#1e3a5f] text-[13px] transition-all focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)]"
                  />

                  <input
                    placeholder="Fin · Ej. Presente"
                    value={newExperience.fechaFin}
                    onChange={(e) =>
                      updateNewExperienceField("fechaFin", e.target.value)
                    }
                    className="w-full min-h-[44px] px-3 bg-white border border-[#e2e8f0] rounded-[11px] outline-none text-[#1e3a5f] text-[13px] transition-all focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)]"
                  />
                </div>

                <textarea
                  rows={4}
                  placeholder="Describe tus responsabilidades, logros y las tecnologías o herramientas que usaste. Mientras más detalle, mejor queda tu CV."
                  value={newExperience.descripcion}
                  onChange={(e) =>
                    updateNewExperienceField("descripcion", e.target.value)
                  }
                  className="w-full min-h-[44px] px-3 py-2.5 bg-white border border-[#e2e8f0] rounded-[11px] outline-none text-[#1e3a5f] text-[13px] transition-all focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)] resize-none"
                />

                <button
                  type="button"
                  onClick={addExperience}
                  className="min-h-[44px] px-3.5 inline-flex items-center justify-center gap-[7px] rounded-[11px] bg-[#1e3a5f] text-white text-xs font-extrabold transition-colors hover:bg-[#2563eb]"
                >
                  <Plus className="w-4 h-4" />
                  {editingExperienceIndex !== null
                    ? "Guardar cambios"
                    : "Agregar experiencia"}
                </button>
              </div>

              {data.experiencia.length > 0 && (
                <div className="space-y-2">
                  {data.experiencia.map((experience, index) => (
                    <div
                      key={index}
                      role="button"
                      tabIndex={0}
                      onClick={() => startEditExperience(index)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          startEditExperience(index);
                        }
                      }}
                      className={`w-full p-3 flex items-center gap-2.5 bg-white border rounded-[13px] text-left transition-all cursor-pointer hover:border-[#93c5fd] hover:bg-[#f8fbff] ${
                        editingExperienceIndex === index
                          ? "border-[#2563eb] bg-[#eff6ff]"
                          : "border-[#e2e8f0]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#1E3A5F] truncate">
                            {experience.puesto}
                          </p>
                          {experience.tipo === "Freelance / Proyecto" && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-[#eff6ff] border border-[#bfdbfe] text-[10px] font-bold text-[#2563EB]">
                              Freelance
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 truncate">
                          {experience.empresa}
                        </p>

                        <p className="text-[11px] text-slate-400">
                          {experience.fechaInicio} —{" "}
                          {experience.fechaFin}
                        </p>

                        {experience.descripcion && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {experience.descripcion}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeExperience(index);
                        }}
                        className="w-9 h-9 min-w-9 flex items-center justify-center text-[#94a3b8] rounded-[9px] transition-all hover:bg-[#fef2f2] hover:text-[#ef4444]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </QuestionLayout>
        );

      /* -----------------------------------------------------
         3 — SKILLS
      ----------------------------------------------------- */

      case 3:
        return (
          <QuestionLayout
            eyebrow="Habilidades"
            title="¿Cuáles son tus principales habilidades?"
            description="Ya agregamos las que detectamos en tu CV. Agrega las que falten — te iremos sugiriendo mientras escribes."
          >
            <div className="space-y-5">
              <div className="relative flex gap-2">
                <input
                  value={newSkill}
                  onChange={(e) =>
                    setNewSkill(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Ej. Excel avanzado, Java, Litigio civil..."
                  className="w-full min-h-[52px] px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] outline-none text-[#1e3a5f] text-[15px] transition-all placeholder:text-[#94a3b8] focus:bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
                />

                <button
                  type="button"
                  onClick={() => addSkill()}
                  className="w-[52px] min-w-[52px] min-h-[52px] flex items-center justify-center rounded-[14px] bg-[#1e3a5f] text-white transition-all hover:bg-[#2563eb]"
                  aria-label="Agregar habilidad"
                >
                  <Plus className="w-5 h-5" />
                </button>

                {sugerenciasHabilidad.length > 0 && (
                  <div className="absolute top-full left-0 right-[60px] mt-1.5 bg-white border border-[#e2e8f0] rounded-xl shadow-lg overflow-hidden z-10">
                    {sugerenciasHabilidad.map((sugerencia) => (
                      <button
                        key={sugerencia}
                        type="button"
                        onClick={() => addSkill(sugerencia)}
                        className="w-full px-4 py-2.5 text-left text-sm text-[#1e3a5f] hover:bg-[#f8fafc] transition-colors"
                      >
                        {sugerencia}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {data.habilidades.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.habilidades.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="min-h-[34px] px-2.5 inline-flex items-center gap-[5px] rounded-[9px] bg-[#eff6ff] border border-[#bfdbfe] text-[#1e3a5f] text-xs font-bold"
                    >
                      {skill}

                      <button
                        type="button"
                        onClick={() =>
                          removeSkill(index)
                        }
                        className="ml-1.5 hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </QuestionLayout>
        );

      /* -----------------------------------------------------
         4 — SPECIALTY
      ----------------------------------------------------- */

      case 4:
        return (
          <QuestionLayout
            eyebrow="Tu perfil"
            title="¿Cuál es tu especialidad?"
            description="Selecciona todas las que apliquen — nos ayuda a encontrar las oportunidades que realmente encajan contigo."
          >
            <div className="space-y-5">
              {especialidadesDelCV.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-[#2563EB]">
                    En base a tu CV vemos que tienes estas especialidades, cuéntanos si hay alguna que no consideremos:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {especialidadesDelCV.map((item) => (
                      <ChoiceButton
                        key={item}
                        selected={data.puestosDeseados?.includes(item)}
                        onClick={() => toggleEspecialidad(item)}
                      >
                        {item}
                      </ChoiceButton>
                    ))}
                  </div>
                </div>
              )}

              {especialidadesCatalogo.length > 0 && (
                <div className="space-y-2.5">
                  {especialidadesDelCV.length > 0 && (
                    <p className="text-xs font-bold text-slate-500">
                      ¿Falta alguna? Selecciona las que apliquen:
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {especialidadesCatalogo.map((item) => (
                      <ChoiceButton
                        key={item}
                        selected={data.puestosDeseados?.includes(item)}
                        onClick={() => toggleEspecialidad(item)}
                      >
                        {item}
                      </ChoiceButton>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={otraEspecialidad}
                  onChange={(e) => setOtraEspecialidad(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && otraEspecialidad.trim()) {
                      toggleEspecialidad(otraEspecialidad.trim());
                      setOtraEspecialidad("");
                    }
                  }}
                  placeholder="¿No está en la lista? Escribe la tuya"
                  className="w-full min-h-[48px] px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] outline-none text-[#1e3a5f] text-sm transition-all placeholder:text-[#94a3b8] focus:bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
                />
                <button
                  type="button"
                  disabled={!otraEspecialidad.trim()}
                  onClick={() => {
                    toggleEspecialidad(otraEspecialidad.trim());
                    setOtraEspecialidad("");
                  }}
                  className="min-h-[48px] px-4 rounded-xl bg-[#1E3A5F] hover:bg-[#2563EB] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>
          </QuestionLayout>
        );

      /* -----------------------------------------------------
         5 — PROFESSIONAL SUMMARY
      ----------------------------------------------------- */

      case 5:
        return (
          <QuestionLayout
            eyebrow="Perfil profesional"
            title="¿Cómo te describes en el ámbito laboral?"
            description="Un breve resumen de tu enfoque, logros clave y lo que buscas en tu próximo reto."
          >
            <div className="space-y-3">
              <textarea
                autoFocus
                rows={7}
                value={data.extractoProfesional ?? ""}
                onChange={(e) =>
                  updateData("extractoProfesional", e.target.value)
                }
                placeholder="Ej. Soy líder técnico con 6 años de experiencia liderando equipos de backend, enfocado en arquitectura escalable y buenas prácticas. Busco un reto donde pueda seguir creciendo como líder técnico..."
                className="w-full p-[15px] bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] outline-none resize-none text-[#1e3a5f] text-sm leading-[1.6] transition-all placeholder:text-[#94a3b8] focus:bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
              />

              <button
                type="button"
                onClick={generarResumenConIA}
                disabled={generandoResumen}
                className="min-h-[44px] px-3.5 inline-flex items-center justify-center gap-[7px] rounded-[11px] bg-[#1e3a5f] text-white text-xs font-extrabold transition-colors hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                {generandoResumen
                  ? "Generando..."
                  : "✨ Generar resumen con IA"}
              </button>

              <div className="p-[11px_13px] flex gap-[9px] items-start bg-[#eff6ff] border border-[#dbeafe] rounded-xl text-[#475569] text-[11px] leading-relaxed">
                <Sparkles className="w-4 h-4 shrink-0" />

                <span>
                  Puedes escribirlo tú o dejar que la IA
                  genere un borrador con base en lo que ya
                  llenaste — siempre puedes editarlo después.
                </span>
              </div>
            </div>
          </QuestionLayout>
        );

      /* -----------------------------------------------------
         6 — EDUCATION
      ----------------------------------------------------- */

      case 6:
        return (
          <QuestionLayout
            eyebrow="Educación y Certificaciones"
            title="¿Cuál es tu formación y certificaciones?"
            description="Agrega tu carrera universitaria, cursos, diplomados o certificaciones técnicas que respalden tu perfil."
          >
            <div className="space-y-4">
              <div className="p-3.5 flex flex-col gap-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl">
                <div className="flex flex-wrap gap-2">
                  {TIPOS_FORMACION.map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() =>
                        setNewEducation({ ...newEducation, tipo })
                      }
                      className={`min-h-[36px] px-3 rounded-[10px] text-xs font-bold border transition-all ${
                        newEducation.tipo === tipo
                          ? "border-[#2563eb] bg-[#eff6ff] text-[#1e3a5f]"
                          : "border-[#e2e8f0] bg-white text-slate-500 hover:border-[#93c5fd]"
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>

                <input
                  placeholder={
                    PLACEHOLDERS_FORMACION[newEducation.tipo].carrera
                  }
                  value={newEducation.carrera}
                  onChange={(e) =>
                    setNewEducation({
                      ...newEducation,
                      carrera: e.target.value,
                    })
                  }
                  className="w-full min-h-[44px] px-3 bg-white border border-[#e2e8f0] rounded-[11px] outline-none text-[#1e3a5f] text-[13px] transition-all focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)]"
                />

                <input
                  placeholder={
                    PLACEHOLDERS_FORMACION[newEducation.tipo].institucion
                  }
                  value={newEducation.institucion}
                  onChange={(e) =>
                    setNewEducation({
                      ...newEducation,
                      institucion: e.target.value,
                    })
                  }
                  className="w-full min-h-[44px] px-3 bg-white border border-[#e2e8f0] rounded-[11px] outline-none text-[#1e3a5f] text-[13px] transition-all focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)]"
                />

                <input
                  placeholder="Año · Ej. 2024"
                  value={newEducation.anio}
                  onChange={(e) =>
                    setNewEducation({
                      ...newEducation,
                      anio: e.target.value,
                    })
                  }
                  className="w-full min-h-[44px] px-3 bg-white border border-[#e2e8f0] rounded-[11px] outline-none text-[#1e3a5f] text-[13px] transition-all focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)]"
                />

                <button
                  type="button"
                  onClick={addEducation}
                  className="min-h-[44px] px-3.5 inline-flex items-center justify-center gap-[7px] rounded-[11px] bg-[#1e3a5f] text-white text-xs font-extrabold transition-colors hover:bg-[#2563eb]"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>

              {data.educacion.map((education, index) => (
                <div
                  key={index}
                  className="p-3 flex items-center gap-2.5 bg-white border border-[#e2e8f0] rounded-[13px]"
                >
                  <GraduationCap className="w-5 h-5 text-[#2563EB] shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#1E3A5F] truncate">
                        {education.carrera}
                      </p>
                      {education.tipo && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-[#eff6ff] border border-[#bfdbfe] text-[10px] font-bold text-[#2563EB]">
                          {education.tipo.split(" / ")[0]}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 truncate">
                      {education.institucion}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      {education.anio}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeEducation(index)
                    }
                    className="w-9 h-9 min-w-9 flex items-center justify-center text-[#94a3b8] rounded-[9px] transition-all hover:bg-[#fef2f2] hover:text-[#ef4444]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </QuestionLayout>
        );

      /* -----------------------------------------------------
         7 — LANGUAGES
      ----------------------------------------------------- */

      case 7:
        return (
          <QuestionLayout
            eyebrow="Idiomas"
            title="¿Qué idiomas dominas?"
            description="Indica tu nivel aproximado. Puedes agregar más de uno."
          >
            <div className="p-3.5 flex flex-col gap-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  placeholder="Ej. Inglés"
                  value={newLanguage.idioma}
                  onChange={(e) =>
                    setNewLanguage({
                      ...newLanguage,
                      idioma: e.target.value,
                    })
                  }
                  className="w-full min-h-[44px] px-3 bg-white border border-[#e2e8f0] rounded-[11px] outline-none text-[#1e3a5f] text-[13px] transition-all focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)]"
                />

                <select
                  value={newLanguage.nivel}
                  onChange={(e) =>
                    setNewLanguage({
                      ...newLanguage,
                      nivel: e.target.value,
                    })
                  }
                  className="w-full min-h-[44px] px-3 bg-white border border-[#e2e8f0] rounded-[11px] outline-none text-[#1e3a5f] text-[13px] transition-all focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)]"
                >
                  {NIVELES_IDIOMA.map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={addLanguage}
                className="min-h-[44px] px-3.5 inline-flex items-center justify-center gap-[7px] rounded-[11px] bg-[#1e3a5f] text-white text-xs font-extrabold transition-colors hover:bg-[#2563eb]"
              >
                <Plus className="w-4 h-4" />
                Agregar idioma
              </button>
            </div>

            {data.idiomas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.idiomas.map((language, index) => (
                  <span
                    key={index}
                    className="min-h-[34px] px-2.5 inline-flex items-center gap-[5px] rounded-[9px] bg-[#eff6ff] border border-[#bfdbfe] text-[#1e3a5f] text-xs font-bold"
                  >
                    <Languages className="w-3.5 h-3.5" />

                    {language.idioma}

                    <strong className="text-[#2563eb]">
                      {language.nivel}
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        removeLanguage(index)
                      }
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </QuestionLayout>
        );

      /* -----------------------------------------------------
         8 — WORK PREFERENCES
      ----------------------------------------------------- */

      case 8: {
        return (
          <QuestionLayout
            eyebrow="Preferencias laborales"
            title="¿Cómo y dónde quieres trabajar?"
            description="Indica dónde vives, en qué estados te gustaría trabajar, tu jornada, disponibilidad y aspiración salarial para mostrarte solo vacantes compatibles."
          >
            <div className="space-y-5">
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-500">
                  ¿Dónde vives actualmente?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <select
                    value={data.estado ?? ""}
                    onChange={(e) => {
                      const nuevoEstado = e.target.value;
                      const ciudadesValidas =
                        municipiosPorEstado[nuevoEstado] ?? [];

                      setData((current) => ({
                        ...current,
                        estado: nuevoEstado,
                        ciudad: ciudadesValidas.includes(current.ciudad)
                          ? current.ciudad
                          : "",
                      }));
                    }}
                    className="w-full min-h-[48px] px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] outline-none text-[#1e3a5f] text-sm transition-all focus:bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
                  >
                    <option value="">Selecciona tu estado</option>
                    {nombresEstados.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>

                  <select
                    value={data.ciudad}
                    onChange={(e) => updateData("ciudad", e.target.value)}
                    disabled={!data.estado}
                    className="w-full min-h-[48px] px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] outline-none text-[#1e3a5f] text-sm transition-all focus:bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {data.estado
                        ? "Selecciona tu ciudad"
                        : "Primero selecciona tu estado"}
                    </option>
                    {(municipiosPorEstado[data.estado ?? ""] ?? []).map(
                      (ciudad) => (
                        <option key={ciudad} value={ciudad}>
                          {ciudad}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500">
                    ¿En qué estados te gustaría trabajar?
                  </p>

                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#2563eb] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={
                        (data.estadosDeseados?.length ?? 0) ===
                        nombresEstados.length
                      }
                      onChange={toggleTodosLosEstados}
                      className="w-3.5 h-3.5 accent-[#2563eb]"
                    />
                    Todos los estados
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {nombresEstados.map((estado) => (
                    <button
                      key={estado}
                      type="button"
                      onClick={() => toggleEnLista("estadosDeseados", estado)}
                      className={`min-h-[38px] px-3 rounded-[10px] text-xs font-bold border transition-all ${
                        data.estadosDeseados?.includes(estado)
                          ? "border-[#2563eb] bg-[#eff6ff] text-[#1e3a5f]"
                          : "border-[#e2e8f0] bg-white text-slate-500 hover:border-[#93c5fd]"
                      }`}
                    >
                      {estado}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-500">
                  ¿Cuánto te gustaría ganar?
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    inputMode="numeric"
                    value={salarioMin}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setSalarioMin(digits);
                      actualizarSalario(digits, salarioMax);
                    }}
                    placeholder="Desde (Ej. 25000)"
                    className="w-full min-h-[48px] px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] outline-none text-[#1e3a5f] text-sm transition-all placeholder:text-[#94a3b8] focus:bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
                  />
                  <input
                    inputMode="numeric"
                    value={salarioMax}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setSalarioMax(digits);
                      actualizarSalario(salarioMin, digits);
                    }}
                    placeholder="Hasta (Ej. 30000)"
                    className="w-full min-h-[48px] px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] outline-none text-[#1e3a5f] text-sm transition-all placeholder:text-[#94a3b8] focus:bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
                  />
                </div>
                {data.salarioDeseado && (
                  <p className="text-xs font-bold text-[#2563eb]">
                    {data.salarioDeseado}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-500">
                  Tipo de empleo
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIPOS_JORNADA.map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => toggleTipoJornada(tipo)}
                      className={`min-h-[40px] px-4 rounded-[10px] text-xs font-bold border transition-all ${
                        data.tipoJornada?.includes(tipo)
                          ? "border-[#2563eb] bg-[#eff6ff] text-[#1e3a5f]"
                          : "border-[#e2e8f0] bg-white text-slate-500 hover:border-[#93c5fd]"
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-500">
                  Idioma de las vacantes
                </p>
                <div className="flex flex-wrap gap-2">
                  {IDIOMAS_VACANTES.map((idioma) => (
                    <button
                      key={idioma}
                      type="button"
                      onClick={() => toggleEnLista("idiomasVacantes", idioma)}
                      className={`min-h-[40px] px-4 rounded-[10px] text-xs font-bold border transition-all ${
                        data.idiomasVacantes?.includes(idioma)
                          ? "border-[#2563eb] bg-[#eff6ff] text-[#1e3a5f]"
                          : "border-[#e2e8f0] bg-white text-slate-500 hover:border-[#93c5fd]"
                      }`}
                    >
                      {idioma}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-500">
                  Modalidad
                </p>
                <div className="flex flex-wrap gap-2">
                  {MODALIDADES_TRABAJO.map((modalidad) => (
                    <button
                      key={modalidad}
                      type="button"
                      onClick={() =>
                        toggleEnLista("modalidadDeseada", modalidad)
                      }
                      className={`min-h-[40px] px-4 rounded-[10px] text-xs font-bold border transition-all ${
                        data.modalidadDeseada?.includes(modalidad)
                          ? "border-[#2563eb] bg-[#eff6ff] text-[#1e3a5f]"
                          : "border-[#e2e8f0] bg-white text-slate-500 hover:border-[#93c5fd]"
                      }`}
                    >
                      {modalidad}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-500">
                  Disponibilidad
                </p>
                <div className="flex flex-wrap gap-2">
                  {OPCIONES_DISPONIBILIDAD.map((opcion) => (
                    <button
                      key={opcion}
                      type="button"
                      onClick={() => updateData("disponibilidad", opcion)}
                      className={`min-h-[40px] px-4 rounded-[10px] text-xs font-bold border transition-all ${
                        data.disponibilidad === opcion
                          ? "border-[#2563eb] bg-[#eff6ff] text-[#1e3a5f]"
                          : "border-[#e2e8f0] bg-white text-slate-500 hover:border-[#93c5fd]"
                      }`}
                    >
                      {opcion}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </QuestionLayout>
        );
      }

      default:
        return null;
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-5">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
            </div>

            <div>
              <p className="text-sm font-black text-[#1E3A5F]">
                Construyamos tu perfil
              </p>

              <p className="text-[11px] text-slate-400">
                Tu información se irá construyendo automáticamente
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-400">
            {progress}%
          </span>
        </div>

        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#2563EB] rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{
              duration: 0.35,
              ease: "easeOut",
            }}
          />
        </div>
      </div>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT */}

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl overflow-hidden">
          <div className="p-5 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[11px] font-bold text-slate-400">
                PREGUNTA {question + 1} DE {TOTAL_QUESTIONS}
              </span>

              {question > 0 && (
                <button
                  type="button"
                  onClick={previousQuestion}
                  className="text-xs font-bold text-slate-400 hover:text-[#1E3A5F] inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Atrás
                </button>
              )}
            </div>

            <div className="min-h-[460px] flex flex-col">
              <AnimatePresence
                mode="wait"
                custom={direction}
              >
                <motion.div
                  key={question}
                  custom={direction}
                  variants={questionVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="flex-1"
                >
                  {renderQuestion()}
                </motion.div>
              </AnimatePresence>

              <div className="pt-7 mt-7 border-t border-slate-100 flex items-center justify-between gap-4">
                <p className="text-[11px] text-slate-400">
                  Puedes modificar tu información después.
                </p>

                <button
                  type="button"
                  onClick={nextQuestion}
                  disabled={!canContinue}
                  className={`min-h-[46px] px-5 inline-flex items-center gap-2 rounded-xl text-white text-xs font-black shadow-lg transition-all ${
                    canContinue
                      ? "bg-[#2563EB] hover:bg-[#1D4ED8] shadow-blue-500/20 cursor-pointer"
                      : "bg-slate-300 shadow-none cursor-not-allowed"
                  }`}
                >
                  {question === TOTAL_QUESTIONS - 1
                    ? "Finalizar perfil"
                    : "Continuar"}

                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}

        <div className="lg:col-span-5">
          <div className="h-full min-h-[560px] rounded-3xl overflow-hidden bg-gradient-to-br from-[#1E3A5F] via-[#0F2744] to-[#0A1929] text-white p-5 sm:p-6 flex flex-col">
            {/* Preview header */}

            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
                </span>

                <span className="text-[10px] font-bold tracking-wider text-blue-200">
                  PERFIL EN CONSTRUCCIÓN
                </span>
              </div>

              <span className="text-[10px] text-white/40">
                {profileStats}% completo
              </span>
            </div>

            {/* Profile */}

            <div className="flex-1 py-5">
              <div className="bg-white/6 border border-white/10 rounded-2xl overflow-hidden">
                {/* Identity */}

                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#2563EB] flex items-center justify-center text-xl font-black">
                      {data.nombreCompleto
                        ? data.nombreCompleto
                            .charAt(0)
                            .toUpperCase()
                        : (
                          <User className="w-6 h-6" />
                        )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="font-black text-lg truncate">
                        {data.nombreCompleto ||
                          "Tu nombre"}
                      </h2>

                      <p className="text-xs text-blue-300 truncate">
                        {data.tituloProfesional ||
                          "Tu especialidad profesional"}
                      </p>
                    </div>
                  </div>

                  {/* Contact */}

                  <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
                    <ProfileContact
                      icon={<Mail />}
                      value={
                        data.email ||
                        "correo@ejemplo.com"
                      }
                    />

                    <ProfileContact
                      icon={<MapPin />}
                      value={
                        [data.ciudad, data.estado]
                          .filter(Boolean)
                          .join(", ") || "Tu ubicación"
                      }
                    />

                    {data.linkedin && (
                      <ProfileContact
                        icon={<Link2 />}
                        value={data.linkedin}
                      />
                    )}
                  </div>
                </div>

                {/* Sections */}

                <PreviewSection
                  icon={<Briefcase />}
                  title="Experiencia"
                  count={data.experiencia.length}
                >
                  {data.experiencia.length > 0 ? (
                    <div className="space-y-3">
                      {data.experiencia
                        .slice(0, 3)
                        .map((experience, index) => (
                          <div key={index}>
                            <p className="text-xs font-bold text-white">
                              {experience.puesto}
                            </p>

                            <p className="text-[10px] text-blue-200/70">
                              {experience.empresa}
                            </p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <EmptyPreview text="Aún no has agregado experiencia" />
                  )}
                </PreviewSection>

                <PreviewSection
                  icon={<Code2 />}
                  title="Habilidades"
                  count={data.habilidades.length}
                >
                  {data.habilidades.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {data.habilidades
                        .slice(0, 8)
                        .map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 rounded-md bg-white/8 border border-white/10 text-[10px] text-blue-100"
                          >
                            {skill}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <EmptyPreview text="Agrega tus principales habilidades" />
                  )}
                </PreviewSection>

                <PreviewSection
                  icon={<GraduationCap />}
                  title="Educación"
                  count={data.educacion.length}
                >
                  {data.educacion.length > 0 ? (
                    <div className="space-y-2">
                      {data.educacion
                        .slice(0, 2)
                        .map((education, index) => (
                          <div key={index}>
                            <p className="text-xs font-bold">
                              {education.carrera}
                            </p>

                            <p className="text-[10px] text-blue-200/70">
                              {education.institucion}
                            </p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <EmptyPreview text="Agrega tu formación académica" />
                  )}
                </PreviewSection>

                <PreviewSection
                  icon={<Languages />}
                  title="Idiomas"
                  count={data.idiomas.length}
                >
                  {data.idiomas.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {data.idiomas.map(
                        (language, index) => (
                          <span
                            key={index}
                            className="text-[10px] px-2 py-1 rounded-md bg-white/8 border border-white/10"
                          >
                            {language.idioma} ·{" "}
                            {language.nivel}
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <EmptyPreview text="Agrega los idiomas que dominas" />
                  )}
                </PreviewSection>

                {/* Target roles */}

                {(data.puestosDeseados?.length ?? 0) >
                  0 && (
                  <PreviewSection
                    icon={<Sparkles />}
                    title="Puestos que buscas"
                    count={
                      data.puestosDeseados?.length ?? 0
                    }
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {data.puestosDeseados
                        ?.slice(0, 5)
                        .map((role) => (
                          <span
                            key={role}
                            className="px-2 py-1 rounded-md bg-blue-500/15 border border-blue-400/20 text-[10px] text-blue-200"
                          >
                            {role}
                          </span>
                        ))}
                    </div>
                  </PreviewSection>
                )}
              </div>
            </div>

            {/* Bottom */}

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Perfil en construcción
                </span>

                <span className="text-[10px] text-white/50">
                  {profileStats}%
                </span>
              </div>

              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-400 rounded-full"
                  animate={{
                    width: `${profileStats}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function QuestionLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-7">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2563EB] mb-2">
          {eyebrow}
        </p>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1E3A5F]">
          {title}
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <div>{children}</div>
    </div>
  );
}

function ChoiceButton({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full min-h-[52px]
        px-4
        rounded-xl
        border
        text-left
        text-sm
        font-bold
        transition-all
        ${
          selected
            ? "border-blue-500 bg-blue-50 text-[#1E3A5F]"
            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/30"
        }
      `}
    >
      <span className="flex items-center justify-between gap-3">
        {children}

        {selected && (
          <Check className="w-4 h-4 text-[#2563EB]" />
        )}
      </span>
    </button>
  );
}

function ProfileContact({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-slate-300">
      <span className="text-blue-300 [&>svg]:w-3.5 [&>svg]:h-3.5">
        {icon}
      </span>

      <span className="truncate">{value}</span>
    </div>
  );
}

function PreviewSection({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4 border-t border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-blue-300 [&>svg]:w-3.5 [&>svg]:h-3.5">
            {icon}
          </span>

          <span className="text-[10px] font-black uppercase tracking-wider text-white/70">
            {title}
          </span>
        </div>

        {count > 0 && (
          <span className="text-[9px] text-emerald-300 font-bold">
            {count} agregado{count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

function EmptyPreview({
  text,
}: {
  text: string;
}) {
  return (
    <p className="text-[10px] text-white/35 italic">
      {text}
    </p>
  );
}
