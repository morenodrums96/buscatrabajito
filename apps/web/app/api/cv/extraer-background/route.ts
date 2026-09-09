import { GoogleGenerativeAI } from "@google/generative-ai";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(client);

export async function POST(req: NextRequest) {
  const { userId, base64, key } = await req.json();
  if (!userId || !base64) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

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
Si algún campo no existe en el CV, déjalo vacío o como array vacío.`;

    const result = await model.generateContent([
      { inlineData: { mimeType: "application/pdf", data: base64 } },
      prompt,
    ]);

    const text = result.response.text().trim().replace(/```json|```/g, "").trim();
    const data = JSON.parse(text);

    // Guardar en DynamoDB con status: "ready"
    await db.send(new UpdateCommand({
      TableName: "buscatrabajito-users",
      Key: { PK: `USER#${userId}`, SK: "CV" },
      UpdateExpression: "SET #st = :st, nombreCompleto = :n, email = :e, telefono = :t, ciudad = :c, linkedin = :l, tituloProfesional = :tp, habilidades = :h, idiomas = :id, experiencia = :ex, educacion = :edu, tieneExperiencia = :te, s3Key = :k, updatedAt = :ua",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: {
        ":st": "ready",
        ":n": data.nombreCompleto ?? "",
        ":e": data.email ?? "",
        ":t": data.telefono ?? "",
        ":c": data.ciudad ?? "",
        ":l": data.linkedin ?? "",
        ":tp": data.tituloProfesional ?? "",
        ":h": data.habilidades ?? [],
        ":id": data.idiomas ?? [],
        ":ex": data.experiencia ?? [],
        ":edu": data.educacion ?? [],
        ":te": data.tieneExperiencia ?? false,
        ":k": key,
        ":ua": new Date().toISOString(),
      },
    }));

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Marcar como error en DynamoDB
    await db.send(new UpdateCommand({
      TableName: "buscatrabajito-users",
      Key: { PK: `USER#${userId}`, SK: "CV" },
      UpdateExpression: "SET #st = :st",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: { ":st": "error" },
    }));
    return NextResponse.json({ error: "Error extrayendo CV" }, { status: 500 });
  }
}
