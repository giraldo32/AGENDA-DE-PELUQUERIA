import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const TIME_ZONE = "America/Bogota";

export function getTodayDateString() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

async function ensureClientForBooking(
  transaction: Prisma.TransactionClient,
  booking: { clienteId: string | null; nombreCliente: string; telefono: string; correo?: string | null },
) {
  if (booking.clienteId) {
    const existingClient = await transaction.cliente.findUnique({
      where: { id: booking.clienteId },
    });

    if (existingClient) {
      return existingClient;
    }
  }

  return transaction.cliente.upsert({
    where: { telefono: booking.telefono },
    update: { nombre: booking.nombreCliente, correo: booking.correo?.trim() || undefined },
    create: {
      nombre: booking.nombreCliente,
      telefono: booking.telefono,
      correo: booking.correo?.trim() || null,
    },
  });
}

export async function archiveExpiredBookings() {
  const today = getTodayDateString();
  const expiredBookings = await prisma.cita.findMany({
    where: {
      fechaCita: {
        lt: today,
      },
    },
  });

  if (expiredBookings.length === 0) {
    return { archived: 0 };
  }

  await prisma.$transaction(async (transaction) => {
    for (const booking of expiredBookings) {
      const client = await ensureClientForBooking(transaction, booking);

      await transaction.historialServicio.create({
        data: {
          clienteId: client.id,
          nombreCliente: booking.nombreCliente,
          telefono: booking.telefono,
          correo: booking.correo,
          fechaServicio: booking.fechaCita,
          horaServicio: booking.horaCita,
          servicioRealizado: booking.tipoCorte,
          profesional: booking.profesional,
          precioServicio: booking.precioEstimado,
          observaciones: booking.notas,
          estado: booking.estado,
        },
      });
    }

    await transaction.cita.deleteMany({
      where: {
        fechaCita: {
          lt: today,
        },
      },
    });
  });

  return { archived: expiredBookings.length };
}

export async function upsertClientFromBooking(data: { nombreCliente: string; telefono: string; correo?: string }) {
  return prisma.cliente.upsert({
    where: { telefono: data.telefono },
    update: { nombre: data.nombreCliente, correo: data.correo?.trim() || undefined },
    create: {
      nombre: data.nombreCliente,
      telefono: data.telefono,
      correo: data.correo?.trim() || null,
    },
  });
}
