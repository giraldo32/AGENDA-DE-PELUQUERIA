import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromCookies();

  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

  const cita = await prisma.cita.findFirst({
    where: {
      clienteId: id,
      fechaCita: today,
    },
    orderBy: [{ horaCita: "asc" }],
  });

  if (!cita) {
    return NextResponse.json({ message: "No hay una cita de hoy para este cliente" }, { status: 404 });
  }

  const updatedBooking = await prisma.cita.update({
    where: { id: cita.id },
    data: { estado: "CONFIRMADA" },
  });

  return NextResponse.json({ cita: updatedBooking, message: "Cita confirmada correctamente" });
}