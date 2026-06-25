# Agenda de Peluquería

Aplicación fullstack en Next.js para que los clientes reserven citas en una peluquería con fecha, hora, descripción del corte y precio estimado. Las reservas se guardan en PostgreSQL con Prisma y el panel admin permite revisar la agenda con credenciales iniciales `admin / admin`.

## Funcionalidades

- Autoagenda de citas con fecha y hora.
- Tipo de corte escrito por el cliente para estimar el precio.
- Servicios adicionales para barba y cejas.
- Disponibilidad por horario para evitar reservas duplicadas.
- Persistencia en PostgreSQL.
- Panel administrativo protegido con usuario `admin` y contraseña `admin`.

## Requisitos

- Node.js 20 o superior.
- PostgreSQL 16 o Docker.

## Arranque rápido

1. Levanta la base de datos:

```bash
docker compose up -d
```

2. Copia las variables de entorno:

```bash
copy .env.example .env
```

3. Instala dependencias:

```bash
npm install
```

4. Ejecuta migraciones y seed:

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

5. Inicia la app:

```bash
npm run dev
```

## Credenciales admin

- Usuario: `admin`
- Contraseña: `admin`

## Modelo de precio

- El valor base se calcula a partir del texto del corte.
- Barba suma un valor extra.
- Cejas suma un valor extra.
- Si el sistema no reconoce el corte, aplica una tarifa base por defecto.

## Estructura

- `src/app` contiene las páginas y rutas API.
- `src/components` contiene la interfaz cliente.
- `src/lib` contiene la lógica compartida de negocio.
- `prisma/schema.prisma` define la persistencia.
