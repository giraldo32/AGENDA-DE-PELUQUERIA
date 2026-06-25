-- Script de tablas PostgreSQL para Agenda de Peluquería
-- Este script coincide con los modelos de Prisma usados por la app.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS citas;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
  id TEXT PRIMARY KEY,
  nombre_usuario TEXT NOT NULL UNIQUE,
  contrasena_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'ADMIN',
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE citas (
  id TEXT PRIMARY KEY,
  nombre_cliente TEXT NOT NULL,
  telefono TEXT NOT NULL,
  tipo_corte TEXT NOT NULL,
  incluye_barba BOOLEAN NOT NULL DEFAULT FALSE,
  incluye_cejas BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_cita TEXT NOT NULL,
  hora_cita TEXT NOT NULL,
  notas TEXT,
  precio_estimado INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE',
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_citas_fecha_hora
  ON citas (fecha_cita, hora_cita);

CREATE INDEX idx_citas_nombre_cliente
  ON citas (nombre_cliente);

CREATE INDEX idx_citas_estado
  ON citas (estado);
