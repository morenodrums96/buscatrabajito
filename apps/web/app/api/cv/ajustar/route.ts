import OpenAI from "openai";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { generarCVPdfBuffer, type CVAjustadoData } from "@/lib/cvPdfTemplate";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(client);

interface Experiencia {
  puesto: string;
  empresa: string;
  fechaInicio?: string;
  fechaFin?: string;
  descripcion: string;
}

interface Educacion {
  carrera: string;
  institucion: string;
  anio?: string;
}

interface Idioma {
  idioma: string;
  nivel: string;
}

// Lo que le pedimos a la IA por idioma — nombre y contacto NO se piden
// (se inyectan directo del CV real después, para no arriesgar que la IA
// altere/alucine un correo o teléfono).
interface CVGenerado {
  tituloProfesional: string;
  resumen: string;
  habilidades: string[];
  experiencia: { puesto: string; empresa: string; fechas: string; descripcion: string[] }[];
  educacion: { carrera: string; institucion: string; anio?: string }[];
  idiomas: { idioma: string; nivel: string }[];
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { jobTitle, company, jobLocation } = await req.json();

  const result = await db.send(new GetCommand({
    TableName: "buscatrabajito-users",
    Key: { PK: `USER#${userId}`, SK: "CV" },
  }));

  const cv = result.Item;
  if (!cv) return NextResponse.json({ error: "No tienes CV guardado" }, { status: 400 });

  const experiencia = (cv.experiencia as Experiencia[]) ?? [];
  const educacion = (cv.educacion as Educacion[]) ?? [];
  const idiomas = (cv.idiomas as Idioma[]) ?? [];
  const habilidades = (cv.habilidades as string[]) ?? [];

  const cvFuente = `
Área profesional actual: ${cv.tituloProfesional ?? ""}
Resumen actual: ${cv.extractoProfesional ?? ""}
Habilidades: ${habilidades.join(", ")}
Experiencia (usa EXACTAMENTE estas fechas, no inventes otras):
${experiencia.map(e => `- ${e.puesto} en ${e.empresa} (${e.fechaInicio ?? "?"} - ${e.fechaFin ?? "Presente"}): ${e.descripcion}`).join("\n")}
Educación:
${educacion.map(e => `- ${e.carrera}, ${e.institucion}${e.anio ? ` (${e.anio})` : ""}`).join("\n")}
Idiomas: ${idiomas.map(i => `${i.idioma} (${i.nivel})`).join(", ")}
  `.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Eres un experto en recursos humanos y redacción de CVs para México y LATAM. Dado el CV de un candidato y una vacante específica, genera una versión ajustada del CV EN ESPAÑOL Y EN INGLÉS, optimizada para esa vacante.

Instrucciones:
- Resalta las habilidades más relevantes para la vacante (puedes reordenar o quitar las irrelevantes, no inventar nuevas).
- Reordena/reescribe la experiencia para que lo más relevante aparezca primero y con más detalle, usando palabras clave que probablemente use el ATS de esta empresa.
- El campo "fechas" de cada experiencia debe usar EXACTAMENTE las fechas dadas en el CV original (no las inventes ni las cambies), en formato corto "MM/YYYY - MM/YYYY" o "MM/YYYY - Presente".
- "descripcion" de cada experiencia es una lista de 2-4 bullets concisos (logros/responsabilidades), no un párrafo.
- No inventes información (empresas, títulos, fechas, tecnologías) que no esté en el CV original.
- La versión en inglés es una adaptación real para el mercado angloparlante (no una traducción literal palabra por palabra), pero debe representar la misma información.
- "nivel" de cada idioma también se traduce (ej. "Avanzado" -> "Advanced").

Responde SOLO con JSON en este formato exacto:
{
  "es": { "tituloProfesional": "...", "resumen": "...", "habilidades": ["..."], "experiencia": [{"puesto":"...","empresa":"...","fechas":"...","descripcion":["...","..."]}], "educacion": [{"carrera":"...","institucion":"...","anio":"..."}], "idiomas": [{"idioma":"...","nivel":"..."}] },
  "en": { "tituloProfesional": "...", "resumen": "...", "habilidades": ["..."], "experiencia": [{"puesto":"...","empresa":"...","fechas":"...","descripcion":["...","..."]}], "educacion": [{"carrera":"...","institucion":"...","anio":"..."}], "idiomas": [{"idioma":"...","nivel":"..."}] }
}`,
      },
      {
        role: "user",
        content: `Vacante: "${jobTitle}" en "${company}" (${jobLocation}).\n\nCV actual:\n${cvFuente}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 2800,
  });

  const raw = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(raw) as { es: CVGenerado; en: CVGenerado };

  const contacto = {
    email: cv.email as string | undefined,
    telefono: cv.telefono as string | undefined,
    linkedin: cv.linkedin as string | undefined,
    ciudad: cv.ciudad as string | undefined,
  };
  const nombre = (cv.nombreCompleto as string) ?? "";

  const datosEs: CVAjustadoData = { nombre, contacto, ...parsed.es };
  const datosEn: CVAjustadoData = { nombre, contacto, ...parsed.en };

  const [pdfEsBuffer, pdfEnBuffer] = await Promise.all([
    generarCVPdfBuffer(datosEs, "es"),
    generarCVPdfBuffer(datosEn, "en"),
  ]);

  // Contador para el resumen del dashboard — best-effort, un fallo aquí no
  // debe tirar la respuesta ya que los PDFs ya se generaron bien.
  db.send(new UpdateCommand({
    TableName: "buscatrabajito-users",
    Key: { PK: `USER#${userId}`, SK: "SEARCH_PROFILE" },
    UpdateExpression: "ADD cvGenerados :one",
    ExpressionAttributeValues: { ":one": 1 },
  })).catch((e) => console.error("No se pudo incrementar cvGenerados:", e));

  return NextResponse.json({
    es: { resumen: datosEs.resumen, tituloProfesional: datosEs.tituloProfesional, pdfBase64: pdfEsBuffer.toString("base64") },
    en: { resumen: datosEn.resumen, tituloProfesional: datosEn.tituloProfesional, pdfBase64: pdfEnBuffer.toString("base64") },
  });
}
