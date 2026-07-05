import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { archiveExpiredBookings, getTodayDateString } from "@/lib/agenda";

export async function GET() {
  try {
    await archiveExpiredBookings();
    const today = getTodayDateString();

    const citas = await prisma.cita.findMany({
      where: { fechaCita: today },
      orderBy: [{ horaCita: "asc" }],
      select: {
        id: true,
        nombreCliente: true,
        telefono: true,
        tipoCorte: true,
        incluyeBarba: true,
        incluyeCejas: true,
        profesional: true,
        fechaCita: true,
        horaCita: true,
        notas: true,
        precioEstimado: true,
        estado: true,
      },
    });

    return NextResponse.json({ citas });
  } catch (error) {
    console.error("Error en GET /api/barbero/citas", error);
    return NextResponse.json({ message: "No se pudieron cargar las citas" }, { status: 500 });
  }
}