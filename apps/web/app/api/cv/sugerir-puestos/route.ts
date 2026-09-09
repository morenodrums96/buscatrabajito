import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { cvData } = await req.json();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Eres un experto en reclutamiento en México y LATAM. Responde SOLO con un JSON array de strings, sin markdown, sin texto adicional.",
      },
      {
        role: "user",
        content: `Analiza este perfil profesional y sugiere entre 4 y 6 puestos de trabajo reales que aparecen en OCC, LinkedIn y Computrabajo en México.

Perfil:
- Habilidades: ${cvData.habilidades?.join(", ")}
- Experiencia: ${cvData.experiencia?.map((e: { puesto: string; empresa: string }) => `${e.puesto} en ${e.empresa}`).join(", ")}
- Educación: ${cvData.educacion?.map((e: { carrera: string }) => e.carrera).join(", ")}
- Área: ${cvData.tituloProfesional}
- Tiene experiencia: ${cvData.tieneExperiencia}

Si no tiene experiencia laboral, sugiere puestos junior o de entrada.
Responde solo con: ["Puesto 1", "Puesto 2", "Puesto 3", "Puesto 4"]`,
      },
    ],
    temperature: 0.3,
    max_tokens: 200,
  });

  const text = response.choices[0].message.content?.trim() ?? "";
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    const puestos = JSON.parse(clean);
    return NextResponse.json({ puestos });
  } catch {
    return NextResponse.json({ puestos: [] }, { status: 500 });
  }
}
