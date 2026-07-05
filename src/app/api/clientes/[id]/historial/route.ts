import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromCookies();

  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const historial = await prisma.historialServicio.findMany({
    where: { clienteId: id },
    orderBy: [{ fechaServicio: "desc" }, { horaServicio: "desc" }],
  });

  return NextResponse.json({ historial });
}