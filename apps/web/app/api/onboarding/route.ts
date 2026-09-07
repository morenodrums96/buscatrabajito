import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(client);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { puesto, nivel, ubicacion, modalidad, whatsapp } = await req.json();

  await db.send(new PutCommand({
    TableName: "buscatrabajito-users",
    Item: {
      PK: `USER#${userId}`,
      SK: "SEARCH_PROFILE",
      puesto,
      nivel,
      ubicacion,
      modalidad,
      whatsapp: whatsapp || null,
      plan: "free",
      createdAt: new Date().toISOString(),
    },
  }));

  return NextResponse.json({ ok: true });
}
