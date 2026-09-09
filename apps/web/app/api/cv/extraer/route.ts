import OpenAI from "openai";
import { PDFParse } from "pdf-parse";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("cv") as File;
  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const parser = new PDFParse({ data: buffer });
  const pdfData = await parser.getText();
  await parser.destroy();
  const texto = pdfData.text.trim().slice(0, 8000);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Eres un extractor de información de CVs. Responde SOLO con JSON válido, sin markdown, sin texto adicional.",
      },
      {
        role: "user",
        content: `Extrae la información de este CV y devuélvela en este formato JSON exacto:
{
  "nombreCompleto": "",
  "email": "",
  "telefono": "",
  "ciudad": "",
  "linkedin": "",
  "tituloProfesional": "",
  "habilidades": [],
  "idiomas": [{ "idioma": "", "nivel": "" }],
  "experiencia": [{ "empresa": "", "puesto": "", "fechaInicio": "", "fechaFin": "", "descripcion": "" }],
  "educacion": [{ "institucion": "", "carrera": "", "anio": "" }],
  "tieneExperiencia": true
}

CV:
${texto}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 2000,
  });

  const text = response.choices[0].message.content?.trim() ?? "";
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    const data = JSON.parse(clean);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "No se pudo extraer la información" }, { status: 500 });
  }
}
