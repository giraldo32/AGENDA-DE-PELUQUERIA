CREATE TABLE IF NOT EXISTS "usuarios" (
  "id" TEXT NOT NULL,
  "nombre_usuario" TEXT NOT NULL,
  "contrasena_hash" TEXT NOT NULL,
  "rol" TEXT NOT NULL DEFAULT 'ADMIN',
  "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "usuarios_nombre_usuario_key" UNIQUE ("nombre_usuario")
);

CREATE TABLE IF NOT EXISTS "clientes" (
  "id" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "telefono" TEXT NOT NULL,
  "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "clientes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "clientes_telefono_key" UNIQUE ("telefono")
);

CREATE TABLE IF NOT EXISTS "citas" (
  "id" TEXT NOT NULL,
  "cliente_id" TEXT NOT NULL,
  "nombre_cliente" TEXT NOT NULL,
  "telefono" TEXT NOT NULL,
  "tipo_corte" TEXT NOT NULL,
  "incluye_barba" BOOLEAN NOT NULL DEFAULT false,
  "incluye_cejas" BOOLEAN NOT NULL DEFAULT false,
  "profesional" TEXT NOT NULL DEFAULT 'Barbero principal',
  "fecha_cita" TEXT NOT NULL,
  "hora_cita" TEXT NOT NULL,
  "notas" TEXT,
  "precio_estimado" INTEGER NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
  "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "citas_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "citas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "historial_servicios" (
  "id" TEXT NOT NULL,
  "cliente_id" TEXT NOT NULL,
  "nombre_cliente" TEXT NOT NULL,
  "telefono" TEXT NOT NULL,
  "fecha_servicio" TEXT NOT NULL,
  "hora_servicio" TEXT NOT NULL,
  "servicio_realizado" TEXT NOT NULL,
  "profesional" TEXT NOT NULL DEFAULT 'Barbero principal',
  "precio_servicio" INTEGER NOT NULL,
  "observaciones" TEXT,
  "estado" TEXT NOT NULL DEFAULT 'FINALIZADA',
  "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "historial_servicios_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "historial_servicios_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "citas" ADD COLUMN IF NOT EXISTS "cliente_id" TEXT;
ALTER TABLE "citas" ADD COLUMN IF NOT EXISTS "profesional" TEXT NOT NULL DEFAULT 'Barbero principal';
ALTER TABLE "historial_servicios" ADD COLUMN IF NOT EXISTS "cliente_id" TEXT;

INSERT INTO "clientes" ("id", "nombre", "telefono", "fecha_creacion", "fecha_actualizacion")
SELECT DISTINCT ON (c."telefono")
  replace(md5(random()::text || clock_timestamp()::text), '-', '') AS id,
  c."nombre_cliente" AS nombre,
  c."telefono" AS telefono,
  CURRENT_TIMESTAMP AS fecha_creacion,
  CURRENT_TIMESTAMP AS fecha_actualizacion
FROM "citas" c
WHERE c."telefono" IS NOT NULL AND c."telefono" <> ''
ON CONFLICT ("telefono") DO UPDATE
SET "nombre" = EXCLUDED."nombre",
  "fecha_actualizacion" = CURRENT_TIMESTAMP;

UPDATE "citas" c
SET "cliente_id" = cl."id"
FROM "clientes" cl
WHERE c."telefono" = cl."telefono" AND (c."cliente_id" IS NULL OR c."cliente_id" = '');

UPDATE "historial_servicios" h
SET "cliente_id" = cl."id"
FROM "clientes" cl
WHERE h."telefono" = cl."telefono" AND (h."cliente_id" IS NULL OR h."cliente_id" = '');

ALTER TABLE "citas" ALTER COLUMN "cliente_id" SET NOT NULL;
ALTER TABLE "historial_servicios" ALTER COLUMN "cliente_id" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "clientes_nombre_idx" ON "clientes" ("nombre");
CREATE INDEX IF NOT EXISTS "citas_cliente_id_idx" ON "citas" ("cliente_id");
CREATE INDEX IF NOT EXISTS "historial_servicios_cliente_id_fecha_servicio_idx" ON "historial_servicios" ("cliente_id", "fecha_servicio");
CREATE INDEX IF NOT EXISTS "historial_servicios_nombre_cliente_idx" ON "historial_servicios" ("nombre_cliente");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'citas_cliente_id_fkey'
  ) THEN
    ALTER TABLE "citas"
    ADD CONSTRAINT "citas_cliente_id_fkey"
    FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'historial_servicios_cliente_id_fkey'
  ) THEN
    ALTER TABLE "historial_servicios"
    ADD CONSTRAINT "historial_servicios_cliente_id_fkey"
    FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
