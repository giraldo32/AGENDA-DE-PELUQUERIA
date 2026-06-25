import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";

const allowedStatuses = new Set(["PENDIENTE", "CONFIRMADA", "CANCELADA"]);

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSessionFromCookies();

    if (!session) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const estado = body?.estado;

    if (typeof estado !== "string" || !allowedStatuses.has(estado)) {
      return NextResponse.json({ message: "Estado inválido" }, { status: 400 });
    }

    const cita = await prisma.cita.update({
      where: { id },
      data: { estado },
    });

    return NextResponse.json({ cita });
  } catch (error) {
    console.error("Error en PATCH /api/bookings/[id]/status", error);
    return NextResponse.json({ message: "No se pudo actualizar la cita" }, { status: 500 });
  }
}