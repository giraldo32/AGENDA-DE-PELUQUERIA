-- Datos iniciales de prueba para Agenda de Peluquería
-- Ejecuta este script después de crear las tablas.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO usuarios (
  id,
  nombre_usuario,
  contrasena_hash,
  rol,
  fecha_creacion,
  fecha_actualizacion
)
VALUES (
  gen_random_uuid()::text,
  'admin',
  crypt('admin', gen_salt('bf')),
  'ADMIN',
  NOW(),
  NOW()
)
ON CONFLICT (nombre_usuario) DO NOTHING;

INSERT INTO usuarios (
  id,
  nombre_usuario,
  contrasena_hash,
  rol,
  fecha_creacion,
  fecha_actualizacion
)
VALUES
(
  gen_random_uuid()::text,
  'maria',
  crypt('123456', gen_salt('bf')),
  'RECEPCION',
  NOW(),
  NOW()
),
(
  gen_random_uuid()::text,
  'jose',
  crypt('123456', gen_salt('bf')),
  'BARBERO',
  NOW(),
  NOW()
),
(
  gen_random_uuid()::text,
  'camila',
  crypt('123456', gen_salt('bf')),
  'RECEPCION',
  NOW(),
  NOW()
)
ON CONFLICT (nombre_usuario) DO NOTHING;

INSERT INTO citas (
  id,
  nombre_cliente,
  telefono,
  tipo_corte,
  incluye_barba,
  incluye_cejas,
  fecha_cita,
  hora_cita,
  notas,
  precio_estimado,
  estado,
  fecha_creacion,
  fecha_actualizacion
)
VALUES
(
  gen_random_uuid()::text,
  'Carlos Pérez',
  '3001112233',
  'fade clásico con diseño',
  TRUE,
  FALSE,
  '2026-06-25',
  '09:00',
  'Cliente nuevo, desea degradado corto.',
  30000,
  'CONFIRMADA',
  NOW(),
  NOW()
),
(
  gen_random_uuid()::text,
  'Andrea López',
  '3004445566',
  'corte largo con puntas',
  FALSE,
  TRUE,
  '2026-06-25',
  '10:30',
  'Solo corte y perfilado de cejas.',
  25000,
  'PENDIENTE',
  NOW(),
  NOW()
),
(
  gen_random_uuid()::text,
  'Luis Ramírez',
  '3007778899',
  'corte clásico con barba',
  TRUE,
  TRUE,
  '2026-06-25',
  '12:00',
  'Barba completa y arreglo de cejas.',
  38000,
  'CONFIRMADA',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;