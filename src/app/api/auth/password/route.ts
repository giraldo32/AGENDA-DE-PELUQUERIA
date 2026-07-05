import { NextResponse } from "next/server";
import { changeAdminPassword, getAdminSessionFromCookies } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getAdminSessionFromCookies();

  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "No se pudo cambiar la contraseña" },
      { status: 400 },
    );
  }

  const result = await changeAdminPassword(session, parsed.data.currentPassword, parsed.data.newPassword);

  if (!result.success) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Contraseña actualizada correctamente" });
}