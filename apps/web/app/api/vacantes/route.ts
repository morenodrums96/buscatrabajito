import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(client);

const ABREVIATURAS: Record<string, string[]> = {
  "nuevo león": ["nuevo leon", "nl", "monterrey", "mty"],
  "ciudad de méxico": ["cdmx", "df", "ciudad de mexico"],
  "jalisco": ["jalisco", "guadalajara", "gdl"],
  "estado de méxico": ["edomex", "estado de mexico", "toluca"],
};

function stripAccents(text: string) {
  return text.normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

// Misma lógica de coincidencia por estado/remoto que usa buscatrabajito-matching,
// para que "Vacantes encontradas" solo muestre lo que de verdad coincide con
// tus preferencias ACTUALES (no lo que coincidía cuando se guardó el match).
function coincideConPreferencias(
  job: Record<string, unknown>,
  estadosDeseados: string[],
  modalidadDeseada: string[]
) {
  const location = String(job.location ?? "").toLowerCase();
  const locationPlain = stripAccents(location);

  if (modalidadDeseada.includes("Remoto")) {
    if (["remoto", "remote", "anywhere"].some((w) => location.includes(w))) {
      return true;
    }
  }

  return estadosDeseados.some((estado) => {
    const estadoLower = estado.toLowerCase();
    const terminos = ABREVIATURAS[estadoLower] ?? [estadoLower, estadoLower.slice(0, 4)];
    return terminos.some((t) => locationPlain.includes(stripAccents(t)));
  });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // La SK es JOB#{job_id} (fija, sin timestamp) para que la misma vacante
  // nunca se duplique si dos corridas del scraper se solapan — por eso el
  // orden "más recientes primero" ya no se puede sacar de la SK y hay que
  // ordenar por seen_at en memoria.
  const [jobsResult, cvResult] = await Promise.all([
    db.send(new QueryCommand({
      TableName: "buscatrabajito-users",
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "JOB#",
      },
    })),
    db.send(new GetCommand({
      TableName: "buscatrabajito-users",
      Key: { PK: `USER#${userId}`, SK: "CV" },
    })),
  ]);

  const estadosDeseados: string[] = cvResult.Item?.estadosDeseados ?? [];
  const modalidadDeseada: string[] = cvResult.Item?.modalidadDeseada ?? [];

  // Sin preferencias guardadas todavía: no filtramos, para no ocultar
  // resultados antes de que el usuario termine de configurar su perfil.
  const sinPreferencias = estadosDeseados.length === 0 && modalidadDeseada.length === 0;

  const items = (jobsResult.Items ?? [])
    .filter((job) => sinPreferencias || coincideConPreferencias(job, estadosDeseados, modalidadDeseada))
    .sort((a, b) => (b.seen_at ?? 0) - (a.seen_at ?? 0));

  return NextResponse.json(items.slice(0, 50));
}
