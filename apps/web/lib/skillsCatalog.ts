import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(dbClient);

const TABLE = "buscatrabajito-users";
const CATALOG_KEY = { PK: "GLOBAL", SK: "SKILLS_CATALOG" };

/**
 * Catálogo global (no ligado a un usuario) de habilidades que se van
 * acumulando de todos los CVs procesados. Sirve para sugerir autocompletado
 * a futuros usuarios, sin importar su profesión.
 */
export async function obtenerCatalogoHabilidades(): Promise<string[]> {
  const result = await db.send(
    new GetCommand({ TableName: TABLE, Key: CATALOG_KEY })
  );
  return (result.Item?.habilidades as string[]) ?? [];
}

export async function agregarHabilidadesAlCatalogo(nuevas: string[]) {
  const limpias = nuevas.map((h) => h.trim()).filter(Boolean);
  if (limpias.length === 0) return;

  const actuales = await obtenerCatalogoHabilidades();
  const vistos = new Set(actuales.map((h) => h.toLowerCase()));
  const combinadas = [...actuales];

  for (const skill of limpias) {
    if (!vistos.has(skill.toLowerCase())) {
      vistos.add(skill.toLowerCase());
      combinadas.push(skill);
    }
  }

  if (combinadas.length === actuales.length) return;

  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        ...CATALOG_KEY,
        habilidades: combinadas,
        updatedAt: new Date().toISOString(),
      },
    })
  );
}
