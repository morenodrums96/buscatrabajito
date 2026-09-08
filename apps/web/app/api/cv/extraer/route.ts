import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("cv") as File;
  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  const prompt = `Eres un extractor de información de CVs. Analiza este CV y extrae la información en formato JSON exactamente así, sin texto adicional, sin markdown, solo el JSON:
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
Si algún campo no existe en el CV, déjalo vacío o como array vacío. tieneExperiencia es false si no tiene experiencia laboral.`;

  const result = await model.generateContent([
    { inlineData: { mimeType: "application/pdf", data: base64 } },
    prompt,
  ]);

  const text = result.response.text().trim();
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    const data = JSON.parse(clean);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "No se pudo extraer la información" }, { status: 500 });
  }
}
