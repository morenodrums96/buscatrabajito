import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(client);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const result = await db.send(new GetCommand({
    TableName: "buscatrabajito-users",
    Key: { PK: `USER#${userId}`, SK: "SEARCH_PROFILE" },
  }));

  return NextResponse.json(result.Item ?? null);
}
