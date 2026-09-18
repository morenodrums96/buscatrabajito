import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { obtenerCatalogoHabilidades } from "@/lib/skillsCatalog";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const habilidades = await obtenerCatalogoHabilidades();
  return NextResponse.json({ habilidades });
}
