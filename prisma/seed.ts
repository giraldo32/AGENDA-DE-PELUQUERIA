import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getTodayDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function createAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const passwordHash = await bcrypt.hash(password, 10);

  const existingUser = await prisma.usuario.findUnique({
    where: {
      nombreUsuario: username,
    },
  });

  if (existingUser) {
    await prisma.usuario.update({
      where: {
        nombreUsuario: username,
      },
      data: {
        contrasenaHash: passwordHash,
        rol: "ADMIN",
      },
    });

    console.log("Administrador actualizado.");
  } else {
    await prisma.usuario.create({
      data: {
        nombreUsuario: username,
        contrasenaHash: passwordHash,
        rol: "ADMIN",
      },
    });

    console.log("Administrador creado.");
  }
}

async function createExampleData() {
  const citas = await prisma.cita.count();

  if (citas > 0) return;

  const cliente = await prisma.cliente.upsert({
    where: {
      telefono: "3000000000",
    },
    update: {},
    create: {
      nombre: "Cliente de ejemplo",
      telefono: "3000000000",
    },
  });

  await prisma.cita.create({
    data: {
      clienteId: cliente.id,
      nombreCliente: cliente.nombre,
      telefono: cliente.telefono,
      tipoCorte: "Fade clásico",
      incluyeBarba: true,
      incluyeCejas: false,
      profesional: "Barbero principal",
      fechaCita: getTodayDateString(),
      horaCita: "10:00",
      notas: "Reserva creada automáticamente",
      precioEstimado: 23000,
      estado: "CONFIRMADA",
    },
  });

  console.log("Datos de ejemplo creados.");
}

async function main() {
  await createAdmin();
  await createExampleData();
}

main()
  .then(() => {
    console.log("Seed ejecutado correctamente.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });