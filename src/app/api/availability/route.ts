import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { availableTimeSlots } from "@/lib/pricing";
import { isValidDateString } from "@/lib/time";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? "";

    if (!isValidDateString(date)) {
      return NextResponse.json({ message: "Fecha inválida" }, { status: 400 });
    }

    const citas = await prisma.cita.findMany({
      where: { fechaCita: date },
      select: { horaCita: true },
    });

    const bookedTimes = citas.map((cita) => cita.horaCita);
    const availableTimes = availableTimeSlots.filter((slot) => !bookedTimes.includes(slot));

    return NextResponse.json({ bookedTimes, availableTimes });
  } catch (error) {
    console.error("Error en /api/availability", error);
    return NextResponse.json({ message: "No se pudo consultar la disponibilidad" }, { status: 500 });
  }
}
