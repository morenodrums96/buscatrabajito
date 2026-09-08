import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(client);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { cvData, perfiles } = await req.json();

  // Guardar CV data
  await db.send(new PutCommand({
    TableName: "buscatrabajito-users",
    Item: {
      PK: `USER#${userId}`,
      SK: "CV",
      ...cvData,
      updatedAt: new Date().toISOString(),
    },
  }));

  // Guardar cada perfil de búsqueda
  for (let i = 0; i < perfiles.length; i++) {
    await db.send(new PutCommand({
      TableName: "buscatrabajito-users",
      Item: {
        PK: `USER#${userId}`,
        SK: `PROFILE#${i + 1}`,
        ...perfiles[i],
        createdAt: new Date().toISOString(),
      },
    }));
  }

  return NextResponse.json({ ok: true });
}
