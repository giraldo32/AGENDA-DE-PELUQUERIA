import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { sendBookingConfirmation } from "@/lib/notifications";

const allowedStatuses = new Set(["PENDIENTE", "CONFIRMADA", "CANCELADA"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSessionFromCookies();

    if (!session) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const estado = body?.estado;

    if (typeof estado !== "string" || !allowedStatuses.has(estado)) {
      return NextResponse.json({ message: "Estado inválido" }, { status: 400 });
    }

    const cita = await prisma.cita.update({
      where: { id },
      data: { estado },
    });

    // Enviar notificaciones solo al confirmar
    if (estado === "CONFIRMADA") {
      try {
        await sendBookingConfirmation({
          nombreCliente: cita.nombreCliente,
          telefono: cita.telefono,
          correo: cita.correo ?? null,
          tipoCorte: cita.tipoCorte,
          fechaCita: cita.fechaCita,
          horaCita: cita.horaCita,
          precioEstimado: cita.precioEstimado,
          notas: cita.notas,
        });
      } catch (notifError) {
        console.error("Error enviando notificaciones (no bloqueante):", notifError);
      }
    }

    return NextResponse.json({ cita });
  } catch (error) {
    console.error("Error en PATCH /api/bookings/[id]/status", error);
    return NextResponse.json({ message: "No se pudo actualizar la cita" }, { status: 500 });
  }
}
