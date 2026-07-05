import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getTodayDateString() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
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

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.usuario.upsert({
    where: { nombreUsuario: adminUsername },
    update: { contrasenaHash: passwordHash, rol: "ADMIN" },
    create: {
      nombreUsuario: adminUsername,
      contrasenaHash: passwordHash,
      rol: "ADMIN",
    },
  });

  const existingBookings = await prisma.cita.count();
  if (existingBookings === 0) {
    const client = await prisma.cliente.upsert({
      where: { telefono: "3000000000" },
      update: { nombre: "Cliente de ejemplo" },
      create: {
        nombre: "Cliente de ejemplo",
        telefono: "3000000000",
      },
    });

    await prisma.cita.create({
      data: {
        clienteId: client.id,
        nombreCliente: "Cliente de ejemplo",
        telefono: "3000000000",
        tipoCorte: "fade clásico",
        incluyeBarba: true,
        incluyeCejas: false,
        profesional: "Barbero principal",
        fechaCita: getTodayDateString(),
        horaCita: "10:00",
        notas: "Reserva inicial creada por el seed",
        precioEstimado: 23000,
        estado: "CONFIRMADA",
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
