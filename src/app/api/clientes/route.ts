import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSessionFromCookies();

  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

  const clientes = await prisma.cliente.findMany({
    orderBy: [{ fechaActualizacion: "desc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      telefono: true,
      fechaCreacion: true,
      fechaActualizacion: true,
      _count: {
        select: {
          citas: true,
          historialServicios: true,
        },
      },
      citas: {
        where: { fechaCita: today },
        orderBy: [{ horaCita: "asc" }],
        take: 1,
        select: {
          id: true,
          estado: true,
          fechaCita: true,
          horaCita: true,
        },
      },
    },
  });

  return NextResponse.json({ clientes });
}