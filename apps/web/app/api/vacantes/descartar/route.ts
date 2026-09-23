import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(client);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { job_id, descartada, motivo } = await req.json();
  if (!job_id || typeof descartada !== "boolean") {
    return NextResponse.json({ error: "job_id y descartada son requeridos" }, { status: 400 });
  }

  // El motivo solo se guarda al descartar (con reason picker); al
  // restaurar no hace falta tocarlo, se queda como quedó por si se
  // vuelve a descartar sin dar una razón nueva.
  if (descartada && typeof motivo === "string") {
    await db.send(new UpdateCommand({
      TableName: "buscatrabajito-users",
      Key: { PK: `USER#${userId}`, SK: `JOB#${job_id}` },
      UpdateExpression: "SET descartada = :d, motivoDescarte = :m",
      ExpressionAttributeValues: { ":d": descartada, ":m": motivo },
    }));
  } else {
    await db.send(new UpdateCommand({
      TableName: "buscatrabajito-users",
      Key: { PK: `USER#${userId}`, SK: `JOB#${job_id}` },
      UpdateExpression: "SET descartada = :d",
      ExpressionAttributeValues: { ":d": descartada },
    }));
  }

  return NextResponse.json({ ok: true });
}
