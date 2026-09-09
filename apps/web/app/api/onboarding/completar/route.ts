import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(dbClient);

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  await db.send(new UpdateCommand({
    TableName: "buscatrabajito-users",
    Key: { PK: `USER#${userId}`, SK: "SEARCH_PROFILE" },
    UpdateExpression: "SET onboardingCompletado = :ok",
    ExpressionAttributeValues: { ":ok": true },
  }));

  return NextResponse.json({ ok: true });
}
