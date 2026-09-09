import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(client);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { nombre, apellidoPaterno, apellidoMaterno, telefono } = await req.json();
  if (!nombre?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const nombreCompleto = `${nombre.trim()} ${apellidoPaterno?.trim() ?? ""}`.trim();

  await db.send(new UpdateCommand({
    TableName: "buscatrabajito-users",
    Key: { PK: `USER#${userId}`, SK: "SEARCH_PROFILE" },
    UpdateExpression: "SET nombreCompleto = :n, apellidoPaterno = :ap, apellidoMaterno = :am, telefono = :t",
    ExpressionAttributeValues: {
      ":n": nombreCompleto,
      ":ap": apellidoPaterno?.trim() ?? "",
      ":am": apellidoMaterno?.trim() ?? "",
      ":t": telefono?.trim() ?? "",
    },
  }));

  return NextResponse.json({ ok: true });
}
