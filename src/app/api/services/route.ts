import { NextResponse } from "next/server";

const services = [
  { id: "haircut", name: "Corte", description: "Descripción libre del estilo que el cliente quiere." },
  { id: "beard", name: "Barba", description: "Perfilado o arreglo de barba." },
  { id: "eyebrows", name: "Cejas", description: "Perfilado de cejas." },
];

export async function GET() {
  return NextResponse.json({ services });
}
