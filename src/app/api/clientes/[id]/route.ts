import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromCookies();

  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.cliente.delete({ where: { id } });
    return NextResponse.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("Error en DELETE /api/clientes/[id]", error);
    return NextResponse.json({ message: "No se pudo eliminar el cliente" }, { status: 500 });
  }
}