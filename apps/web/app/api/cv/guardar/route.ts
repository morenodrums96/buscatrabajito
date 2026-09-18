import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { agregarHabilidadesAlCatalogo } from "@/lib/skillsCatalog";

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
      confirmado: true,
      updatedAt: new Date().toISOString(),
    },
  }));

  // Alimentamos el catálogo global de habilidades con lo que el usuario
  // haya agregado manualmente, para las sugerencias de futuros usuarios.
  agregarHabilidadesAlCatalogo(cvData?.habilidades ?? []).catch((e) =>
    console.error("agregarHabilidadesAlCatalogo error:", e)
  );

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
