import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(client);

// Alias que puede traer el segmento de estado de un location tipo
// "Ciudad, Estado, País" (ej. "Miguel Hidalgo, CDMX, Ciudad de México,
// México" -> segmento "cdmx"). Solo se usan para comparar ESE segmento,
// nunca el string completo (ver por qué en coincideConPreferencias).
const ALIAS_ESTADO: Record<string, string[]> = {
  "nuevo leon": ["nl", "monterrey", "mty"],
  "ciudad de mexico": ["cdmx", "df", "distrito federal"],
  "estado de mexico": ["edomex", "mexico"],
  "jalisco": ["gdl", "guadalajara"],
};

function stripAccents(text: string) {
  return text.normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

const IDIOMA_CODIGOS: Record<string, string> = { "Español": "es", "Inglés": "en" };

// Misma heurística que matching.py: sin librería de detección de idioma,
// solo conectores y palabras de puesto típicas del español. Si no
// aparece ninguna, se asume inglés (default de LinkedIn y la mayoría de
// fuentes).
const PALABRAS_CONECTORAS_ES = new Set(["de", "del", "para", "con", "en", "y"]);
const PALABRAS_PUESTO_ES = new Set([
  "gerente", "desarrollador", "desarrolladora", "ingeniero", "ingeniera",
  "analista", "director", "directora", "lider", "encargado", "encargada",
  "auxiliar", "ejecutivo", "ejecutiva", "vendedor", "vendedora", "contador",
  "contadora", "disenador", "disenadora", "atencion", "cliente", "ventas",
  "recursos", "humanos", "practicante", "asistente", "representante",
  "coordinador", "coordinadora", "supervisor", "supervisora",
  "especialista", "responsable", "jefe", "jefa",
]);

function detectarIdioma(texto: string): string {
  const palabras = stripAccents(texto.toLowerCase()).split(/\s+/);
  if (palabras.some((w) => PALABRAS_CONECTORAS_ES.has(w) || PALABRAS_PUESTO_ES.has(w))) {
    return "es";
  }
  return "en";
}

// Igual que el idioma: no hay un campo explícito de tipo de empleo en las
// fuentes scrapeadas, se infiere del título. "Tiempo completo" es el
// default cuando no hay ninguna señal más específica.
function detectarTipoEmpleo(titulo: string): string {
  const t = stripAccents(titulo.toLowerCase());
  if (["becario", "becaria", "practicante", "practicas", "intern", "trainee"].some((p) => t.includes(p))) {
    return "Prácticas / Becario";
  }
  if (["freelance", "por proyecto", "project-based", "temporal", "temporary"].some((p) => t.includes(p))) {
    return "Freelance / Proyecto";
  }
  if (["medio tiempo", "part time", "part-time", "parcial"].some((p) => t.includes(p))) {
    return "Medio tiempo";
  }
  return "Tiempo completo";
}

// Misma lógica de coincidencia por estado/remoto/idioma que usa
// buscatrabajito-matching, para que "Vacantes encontradas" solo muestre
// lo que de verdad coincide con tus preferencias ACTUALES (no lo que
// coincidía cuando se guardó el match).
function coincideConPreferencias(
  job: Record<string, unknown>,
  estadosDeseados: string[],
  modalidadDeseada: string[],
  idiomasDeseados: string[],
  tiposTrabajoDeseados: string[]
) {
  const location = String(job.location ?? "").toLowerCase();
  const locationPlain = stripAccents(location);

  if (idiomasDeseados.length > 0) {
    const codigosDeseados = idiomasDeseados
      .map((i) => IDIOMA_CODIGOS[i])
      .filter((c): c is string => Boolean(c));
    // Algunas fuentes (ej. Freelancer.com) guardan el idioma real de la
    // vacante — más confiable que adivinar por palabras clave.
    const idiomaGuardado = String(job.idioma ?? "");
    const idiomaJob = idiomaGuardado || detectarIdioma(String(job.title ?? ""));
    if (codigosDeseados.length > 0 && !codigosDeseados.includes(idiomaJob)) {
      return false;
    }
  }

  if (tiposTrabajoDeseados.length > 0) {
    // Freelancer.com es 100% trabajo freelance por definición.
    const tipoJob =
      job.source === "Freelancer" ? "Freelance / Proyecto" : detectarTipoEmpleo(String(job.title ?? ""));
    if (!tiposTrabajoDeseados.includes(tipoJob)) {
      return false;
    }
  }

  if (modalidadDeseada.includes("Remoto")) {
    if (["remoto", "remote", "anywhere"].some((w) => location.includes(w))) {
      return true;
    }
  }

  // Sin estado seleccionado (ej. usuario solo configuró idioma o
  // modalidad): no hay nada que comparar aquí, así que no se descarta.
  if (estadosDeseados.length === 0) {
    return true;
  }

  // El location normalmente viene como "Ciudad, Estado, País". Varios
  // municipios se llaman igual en distintos estados (ej. "Juárez" existe
  // en Nuevo León Y en Chihuahua) — comparar contra el string completo
  // genera falsos positivos. Si hay 3+ partes, el segmento de estado
  // (penúltimo, antes del país) manda por sí solo. Si no (ej. "Nuevo
  // León, México" sin ciudad, o "Remoto"), se cae a comparar el estado
  // contra el string completo (sin municipios, para no arriesgar).
  const partes = location.split(",").map((p) => p.trim());
  const estadoEnLocationPlain = partes.length >= 3 ? stripAccents(partes[partes.length - 2]) : null;

  return estadosDeseados.some((estado) => {
    const estadoPlain = stripAccents(estado.toLowerCase());

    if (estadoEnLocationPlain !== null) {
      const alias = ALIAS_ESTADO[estadoPlain] ?? [];
      return (
        estadoPlain === estadoEnLocationPlain ||
        estadoEnLocationPlain.includes(estadoPlain) ||
        alias.includes(estadoEnLocationPlain)
      );
    }

    return locationPlain.includes(estadoPlain);
  });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // La SK es JOB#{job_id} (fija, sin timestamp) para que la misma vacante
  // nunca se duplique si dos corridas del scraper se solapan — por eso el
  // orden "más recientes primero" ya no se puede sacar de la SK y hay que
  // ordenar por seen_at en memoria.
  const [jobsResult, cvResult] = await Promise.all([
    db.send(new QueryCommand({
      TableName: "buscatrabajito-users",
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "JOB#",
      },
    })),
    db.send(new GetCommand({
      TableName: "buscatrabajito-users",
      Key: { PK: `USER#${userId}`, SK: "CV" },
    })),
  ]);

  const estadosDeseados: string[] = cvResult.Item?.estadosDeseados ?? [];
  const modalidadDeseada: string[] = cvResult.Item?.modalidadDeseada ?? [];
  const idiomasDeseados: string[] = cvResult.Item?.idiomasVacantes ?? [];
  const tiposTrabajoDeseados: string[] = cvResult.Item?.tipoJornada ?? [];

  // Sin preferencias guardadas todavía: no filtramos, para no ocultar
  // resultados antes de que el usuario termine de configurar su perfil.
  const sinPreferencias =
    estadosDeseados.length === 0 &&
    modalidadDeseada.length === 0 &&
    idiomasDeseados.length === 0 &&
    tiposTrabajoDeseados.length === 0;

  // Ordena por la fecha real de publicación (posted_date, ej. LinkedIn)
  // cuando existe — así "más reciente" refleja cuándo se publicó la
  // vacante, no cuándo la encontró el scraper. Si no hay posted_date
  // (otras fuentes sin ese dato), cae de regreso a seen_at.
  function fechaParaOrdenar(job: Record<string, unknown>): number {
    const postedDate = job.posted_date as string | undefined;
    if (postedDate) {
      const ts = new Date(`${postedDate}T00:00:00Z`).getTime();
      if (!Number.isNaN(ts)) return ts / 1000;
    }
    return (job.seen_at as number) ?? 0;
  }

  const items = (jobsResult.Items ?? [])
    .filter((job) => sinPreferencias || coincideConPreferencias(job, estadosDeseados, modalidadDeseada, idiomasDeseados, tiposTrabajoDeseados))
    .sort((a, b) => fechaParaOrdenar(b) - fechaParaOrdenar(a));

  return NextResponse.json(items);
}
