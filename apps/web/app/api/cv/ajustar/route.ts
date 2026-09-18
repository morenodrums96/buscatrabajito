import OpenAI from "openai";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(client);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { jobTitle, company, jobLocation } = await req.json();

  // Obtener CV del usuario
  const result = await db.send(new GetCommand({
    TableName: "buscatrabajito-users",
    Key: { PK: `USER#${userId}`, SK: "CV" },
  }));

  const cv = result.Item;
  if (!cv) return NextResponse.json({ error: "No tienes CV guardado" }, { status: 400 });

  const cvTexto = `
Nombre: ${cv.nombreCompleto}
Área profesional: ${cv.tituloProfesional}
Habilidades: ${(cv.habilidades as string[])?.join(", ")}
Experiencia: ${(cv.experiencia as { puesto: string; empresa: string; descripcion: string }[])?.map(e => `${e.puesto} en ${e.empresa}: ${e.descripcion}`).join(" | ")}
Educación: ${(cv.educacion as { carrera: string; institucion: string }[])?.map(e => `${e.carrera} - ${e.institucion}`).join(", ")}
Idiomas: ${(cv.idiomas as { idioma: string; nivel: string }[])?.map(i => `${i.idioma} (${i.nivel})`).join(", ")}
  `.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Eres un experto en recursos humanos y redacción de CVs para México y LATAM. Tu trabajo es ajustar un CV para maximizar las probabilidades de ser seleccionado para una vacante específica.",
      },
      {
        role: "user",
        content: `Ajusta este CV para la vacante de "${jobTitle}" en "${company}" (${jobLocation}).

CV actual:
${cvTexto}

Instrucciones:
- Resalta las habilidades más relevantes para esta vacante
- Reordena la experiencia para que lo más relevante aparezca primero  
- Usa palabras clave que probablemente use el ATS de esta empresa
- Mantén el formato limpio y profesional
- No inventes información que no esté en el CV original
- Responde con el CV ajustado listo para copiar y pegar`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  });

  const cvAjustado = response.choices[0].message.content?.trim() ?? "";
  return NextResponse.json({ cv: cvAjustado });
}
