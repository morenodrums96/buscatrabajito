import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { cvData } = await req.json();

  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  const prompt = `Eres un experto en reclutamiento en México y LATAM. Analiza este perfil profesional y sugiere entre 4 y 6 puestos de trabajo a los que esta persona puede aplicar exitosamente.

Perfil:
- Habilidades: ${cvData.habilidades?.join(", ")}
- Experiencia: ${cvData.experiencia?.map((e: { puesto: string; empresa: string }) => `${e.puesto} en ${e.empresa}`).join(", ")}
- Educación: ${cvData.educacion?.map((e: { carrera: string }) => e.carrera).join(", ")}
- Título/Área: ${cvData.tituloProfesional}
- Tiene experiencia laboral: ${cvData.tieneExperiencia}

Responde SOLO con un JSON array de strings, sin texto adicional, sin markdown:
["Puesto 1", "Puesto 2", "Puesto 3", "Puesto 4"]

Los puestos deben ser nombres reales de vacantes que aparecen en OCC, LinkedIn y Computrabajo en México. Si no tiene experiencia, sugiere puestos junior o de entrada.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().replace(/```json|```/g, "").trim();

  try {
    const puestos = JSON.parse(text);
    return NextResponse.json({ puestos });
  } catch {
    return NextResponse.json({ puestos: [] }, { status: 500 });
  }
}
