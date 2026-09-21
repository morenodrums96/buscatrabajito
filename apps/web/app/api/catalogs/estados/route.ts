import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(client);

export interface EstadoConMunicipios {
  nombre: string;
  municipios: string[];
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const result = await db.send(new ScanCommand({
    TableName: "buscatrabajito-catalogs",
    FilterExpression: "SK = :sk",
    ExpressionAttributeValues: { ":sk": "MUNICIPALITIES" },
  }));

  const estados: EstadoConMunicipios[] = (result.Items ?? [])
    .map((item) => ({
      nombre: item.nombre as string,
      municipios: (item.municipios as string[]) ?? [],
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return NextResponse.json(estados);
}
