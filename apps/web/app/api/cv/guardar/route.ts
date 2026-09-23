import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { agregarHabilidadesAlCatalogo } from "@/lib/skillsCatalog";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(client);
const lambda = new LambdaClient({ region: process.env.AWS_REGION });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Mismo criterio que usaba el scraper antes de tener términos normalizados:
// solo la primera parte significativa del puesto. Se usa como respaldo si
// la IA falla o no está disponible.
function normalizarPuestoFallback(puesto: string): string {
  return puesto.split(/[/(\-–]/)[0].trim();
}

// Se llama UNA vez al guardar el perfil (no en cada corrida del scraper).
// Devuelve variantes en inglés y español del mismo puesto, para buscar
// bien tanto en portales en inglés (LinkedIn, Indeed) como en español
// (Computrabajo, OCC, Bumeran).
async function normalizarTerminosBusqueda(puesto: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Eres un experto en nomenclatura de puestos de trabajo, en español e inglés, de TODAS las industrias (no solo tecnología — manufactura, salud, ventas, ingeniería industrial, etc.). Dado un puesto de trabajo (a veces escrito de forma larga, con modificadores como "freelance", "proyecto" o tecnologías entre paréntesis), devuelve una lista corta (3 a 6) de términos de búsqueda equivalentes, EN INGLÉS Y ESPAÑOL, que se usarían para encontrar ese tipo de vacante en portales de empleo bilingües (LinkedIn, Indeed, Computrabajo, OCC, Bumeran, etc.). Cada término debe ser un título de puesto real y buscable por sí solo — nunca un calificador suelto como "freelance", "proyecto", "player-coach" o similares. No inventes tecnologías, industria o seniority que no estén en el puesto original — si el puesto es genérico (ej. "Líder de Ingeniería" o "Gerente de Producción" sin más contexto), NO asumas que es de software/tecnología a menos que el puesto lo diga explícitamente ("Líder Técnico de Software", "Ingeniero de Software", etc.); usa variantes igual de genéricas, sin inclinarte hacia ninguna industria en particular. Responde SOLO con JSON en este formato: {"terminos": ["termino1", "termino2", ...]}.

Ejemplos:
"Líder de Ingeniería" -> {"terminos": ["Engineering Lead", "Engineering Manager", "Líder de Ingeniería", "Jefe de Ingeniería"]}
"Arquitectura de Software" -> {"terminos": ["Software Architect", "Solutions Architect", "Enterprise Architect", "Arquitecto de Software"]}
"Engineering Lead / Backend (Node.js) - Proyecto freelance" -> {"terminos": ["Engineering Lead", "Backend Engineer", "Tech Lead", "Node.js Engineer", "Ingeniero Backend"]}
"Gerente de Producción" -> {"terminos": ["Production Manager", "Manufacturing Manager", "Gerente de Producción", "Jefe de Producción"]}
"Ingeniero Mecatrónico" -> {"terminos": ["Mechatronics Engineer", "Automation Engineer", "Controls Engineer", "Ingeniero en Mecatrónica"]}
"Data Analyst" -> {"terminos": ["Data Analyst", "Business Intelligence Analyst", "Analytics Analyst", "Analista de Datos"]}`,
        },
        { role: "user", content: puesto },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const raw = response.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(raw);
    const terminos = Array.isArray(parsed.terminos)
      ? parsed.terminos
          .filter((t: unknown): t is string => typeof t === "string" && t.trim().length > 0)
          .map((t: string) => t.trim())
      : [];

    return terminos.length > 0 ? terminos : [normalizarPuestoFallback(puesto)];
  } catch (err) {
    console.error("normalizarTerminosBusqueda error:", err);
    return [normalizarPuestoFallback(puesto)];
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { cvData, perfiles } = await req.json();

  // Guardar CV data
  await db.send(new PutCommand({
    TableName: "buscatrabajito-users",
    Item: {
      PK: `USER#${userId}`,
      SK: "CV",
      ...cvData,
      confirmado: true,
      updatedAt: new Date().toISOString(),
    },
  }));

  // Alimentamos el catálogo global de habilidades con lo que el usuario
  // haya agregado manualmente, para las sugerencias de futuros usuarios.
  agregarHabilidadesAlCatalogo(cvData?.habilidades ?? []).catch((e) =>
    console.error("agregarHabilidadesAlCatalogo error:", e)
  );

  // Guardar cada perfil de búsqueda, con sus términos normalizados.
  await Promise.all(
    (perfiles as { puesto: string }[]).map(async (perfil, i) => {
      const sk = `PROFILE#${i + 1}`;

      // Si el puesto no cambió desde el último guardado, reusamos los
      // términos ya calculados en vez de volver a llamar a la IA.
      let terminosBusqueda: string[] | undefined;
      try {
        const existente = await db.send(new GetCommand({
          TableName: "buscatrabajito-users",
          Key: { PK: `USER#${userId}`, SK: sk },
        }));
        if (
          existente.Item?.puesto === perfil.puesto &&
          Array.isArray(existente.Item?.terminos_busqueda) &&
          existente.Item.terminos_busqueda.length > 0
        ) {
          terminosBusqueda = existente.Item.terminos_busqueda;
        }
      } catch (e) {
        console.error("Error leyendo perfil existente:", e);
      }

      if (!terminosBusqueda) {
        terminosBusqueda = await normalizarTerminosBusqueda(perfil.puesto);
      }

      await db.send(new PutCommand({
        TableName: "buscatrabajito-users",
        Item: {
          PK: `USER#${userId}`,
          SK: sk,
          ...perfil,
          terminos_busqueda: terminosBusqueda,
          createdAt: new Date().toISOString(),
        },
      }));
    })
  );

  // Sin esto, un usuario que acaba de armar su perfil tenía que esperar
  // hasta 30 min (la próxima corrida programada de EventBridge) para ver
  // su primera vacante — mala primera impresión, sobre todo para alguien
  // que acaba de pagar. Se dispara el scraper aparte (~5-6 min) en vez de
  // esperar el ciclo normal. Async ("Event"): no bloquea la respuesta al
  // usuario, y si ya hay una corrida en curso (concurrencia reservada en
  // 1), Lambda reintenta la invocación sola con backoff.
  if (Array.isArray(perfiles) && perfiles.length > 0) {
    lambda
      .send(new InvokeCommand({
        FunctionName: "job-bot-scraper",
        InvocationType: "Event",
        Payload: Buffer.from("{}"),
      }))
      .catch((e) => console.error("Error disparando job-bot-scraper:", e));
  }

  return NextResponse.json({ ok: true });
}
