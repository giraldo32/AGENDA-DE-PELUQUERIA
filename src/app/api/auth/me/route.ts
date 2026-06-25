import { NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSessionFromCookies();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json({ usuario: session });
}
