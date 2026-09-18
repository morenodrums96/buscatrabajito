import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(client);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // La SK es JOB#{job_id} (fija, sin timestamp) para que la misma vacante
  // nunca se duplique si dos corridas del scraper se solapan — por eso el
  // orden "más recientes primero" ya no se puede sacar de la SK y hay que
  // ordenar por seen_at en memoria.
  const result = await db.send(new QueryCommand({
    TableName: "buscatrabajito-users",
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `USER#${userId}`,
      ":sk": "JOB#",
    },
  }));

  const items = (result.Items ?? []).sort(
    (a, b) => (b.seen_at ?? 0) - (a.seen_at ?? 0)
  );

  return NextResponse.json(items.slice(0, 50));
}
