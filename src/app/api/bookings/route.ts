import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { estimateHaircutPrice } from "@/lib/pricing";
import { citaSchema } from "@/lib/validation";
import { isValidDateString, isValidTimeSlot } from "@/lib/time";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { archiveExpiredBookings, getTodayDateString, upsertClientFromBooking } from "@/lib/agenda";

export async function POST(request: Request) {
  try {
    await archiveExpiredBookings();

    const body = await request.json();
    const parsed = citaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Completa todos los campos obligatorios" }, { status: 400 });
    }

    const data = parsed.data;

    if (!isValidDateString(data.fechaCita) || !isValidTimeSlot(data.horaCita)) {
      return NextResponse.json({ message: "Fecha u hora inválida" }, { status: 400 });
    }

    const existingBooking = await prisma.cita.findFirst({
      where: {
        fechaCita: data.fechaCita,
        horaCita: data.horaCita,
      },
    });

    if (existingBooking) {
      return NextResponse.json({ message: "Ese horario ya está ocupado" }, { status: 409 });
    }

    const estimate = estimateHaircutPrice({
      haircutType: data.tipoCorte,
      includeBeard: data.incluyeBarba,
      includeEyebrows: data.incluyeCejas,
    });

    const client = await upsertClientFromBooking({
      nombreCliente: data.nombreCliente,
      telefono: data.telefono,
    });

    const cita = await prisma.cita.create({
      data: {
        clienteId: client.id,
        nombreCliente: data.nombreCliente,
        telefono: data.telefono,
        tipoCorte: data.tipoCorte,
        incluyeBarba: data.incluyeBarba,
        incluyeCejas: data.incluyeCejas,
        profesional: "Barbero principal",
        fechaCita: data.fechaCita,
        horaCita: data.horaCita,
        notas: data.notas?.trim() ? data.notas : null,
        precioEstimado: estimate.estimatedPrice,
      },
    });

    return NextResponse.json({ cita, estimate }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/bookings", error);
    return NextResponse.json({ message: "No se pudo crear la reserva" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getAdminSessionFromCookies();

    if (!session) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    await archiveExpiredBookings();
    const today = getTodayDateString();

    const citas = await prisma.cita.findMany({
      where: { fechaCita: today },
      orderBy: [{ horaCita: "asc" }],
    });

    return NextResponse.json({ citas });
  } catch (error) {
    console.error("Error en GET /api/bookings", error);
    return NextResponse.json({ message: "No se pudieron cargar las reservas" }, { status: 500 });
  }
}
