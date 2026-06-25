import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    await prisma.cita.create({
      data: {
        nombreCliente: "Cliente de ejemplo",
        telefono: "3000000000",
        tipoCorte: "fade clásico",
        incluyeBarba: true,
        incluyeCejas: false,
        fechaCita: "2026-06-24",
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
