import { z } from "zod";

export const citaSchema = z.object({
  nombreCliente: z.string().min(2, "Ingresa tu nombre completo"),
  telefono: z.string().min(7, "Ingresa un teléfono válido"),
  correo: z
    .string()
    .trim()
    .email("Ingresa un correo válido")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  tipoCorte: z.string().min(2, "Describe el tipo de corte"),
  incluyeBarba: z.boolean().default(false),
  incluyeCejas: z.boolean().default(false),
  fechaCita: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  horaCita: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  notas: z.string().max(500).optional(),
});

export const loginSchema = z.object({
  usuario: z.string().min(1),
  contrasena: z.string().min(1),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
    newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
    confirmNewPassword: z.string().min(1, "Confirma la nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Las contraseñas nuevas no coinciden",
    path: ["confirmNewPassword"],
  });
