import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Experiencia {
  puesto?: string;
  empresa?: string;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const {
    nombreCompleto,
    tituloProfesional,
    aniosExperiencia,
    habilidades,
    experiencia,
    puestosDeseados,
  } = await req.json();

  const experienciaTexto = ((experiencia ?? []) as Experiencia[])
    .map((e) => `${e.puesto ?? ""} en ${e.empresa ?? ""}`.trim())
    .filter(Boolean)
    .join("; ");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un redactor de perfiles profesionales para CVs. Responde SOLO con el texto del resumen, sin comillas, sin markdown, sin explicaciones adicionales.",
        },
        {
          role: "user",
          content: `Escribe un resumen profesional breve (2 a 4 oraciones, en español, en primera persona) para el perfil de esta persona, basado en esta información. No inventes datos que no estén aquí; si falta información, escribe un resumen genérico con lo que sí hay.

Nombre: ${nombreCompleto || "N/D"}
Título profesional: ${tituloProfesional || "N/D"}
Años de experiencia: ${aniosExperiencia || "N/D"}
Habilidades principales: ${(habilidades ?? []).join(", ") || "N/D"}
Experiencia laboral: ${experienciaTexto || "N/D"}
Puestos que busca: ${(puestosDeseados ?? []).join(", ") || "N/D"}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 220,
    });

    const resumen = response.choices[0].message.content?.trim() ?? "";
    return NextResponse.json({ resumen });
  } catch (err) {
    console.error("generar-resumen error:", err);
    return NextResponse.json(
      { error: "No se pudo generar el resumen" },
      { status: 500 }
    );
  }
}
