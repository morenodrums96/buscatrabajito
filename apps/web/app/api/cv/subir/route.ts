import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import OpenAI from "openai";
import { PDFParse } from "pdf-parse";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(dbClient);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extraerCV(userId: string, buffer: Buffer, key: string) {
  try {
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
    const data = JSON.parse(clean);

    await db.send(new UpdateCommand({
      TableName: "buscatrabajito-users",
      Key: { PK: `USER#${userId}`, SK: "CV" },
      UpdateExpression: "SET #st = :st, nombreCompleto = :n, email = :e, telefono = :t, ciudad = :c, linkedin = :l, tituloProfesional = :tp, habilidades = :h, idiomas = :id, experiencia = :ex, educacion = :edu, tieneExperiencia = :te, updatedAt = :ua",
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
        ":ua": new Date().toISOString(),
      },
    }));
  } catch (err) {
    console.error("extraerCV error:", err);
    await db.send(new UpdateCommand({
      TableName: "buscatrabajito-users",
      Key: { PK: `USER#${userId}`, SK: "CV" },
      UpdateExpression: "SET #st = :st",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: { ":st": "error" },
    }));
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("cv") as File;
  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const key = `clients/${userId}/cv/original.pdf`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: "application/pdf",
  }));

  await db.send(new PutCommand({
    TableName: "buscatrabajito-users",
    Item: {
      PK: `USER#${userId}`,
      SK: "CV",
      status: "processing",
      s3Key: key,
      createdAt: new Date().toISOString(),
    },
  }));

  extraerCV(userId, buffer, key);

  return NextResponse.json({ ok: true, key });
}
