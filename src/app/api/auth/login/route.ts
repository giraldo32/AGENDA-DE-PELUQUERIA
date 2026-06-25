import { NextResponse } from "next/server";
import { authenticateAdmin, setAdminCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Credenciales inválidas" }, { status: 400 });
  }

  const token = await authenticateAdmin(parsed.data.usuario, parsed.data.contrasena);

  if (!token) {
    return NextResponse.json({ message: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  await setAdminCookie(token);
  return NextResponse.json({ message: "Sesión iniciada" });
}
