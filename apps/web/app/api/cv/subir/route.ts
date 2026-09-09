import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("cv") as File;
  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const key = `clients/${userId}/cv/original.pdf`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: "application/pdf",
  }));

  return NextResponse.json({ ok: true, key });
}
