import { NextResponse } from "next/server";
import { estimateHaircutPrice } from "@/lib/pricing";
import { citaSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = citaSchema.pick({ tipoCorte: true, incluyeBarba: true, incluyeCejas: true }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
  }

  const price = estimateHaircutPrice({
    haircutType: parsed.data.tipoCorte,
    includeBeard: parsed.data.incluyeBarba,
    includeEyebrows: parsed.data.incluyeCejas,
  });
  return NextResponse.json(price);
}
