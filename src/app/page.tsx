import { BookingForm } from "@/components/booking-form";
import { MapPin, Scissors, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

const highlights = [
  {
    title: "Autoagenda real",
    description: "El cliente elige fecha, hora y servicios sin llamar por teléfono.",
    icon: Scissors,
  },
  {
    title: "Precio estimado",
    description: "El sistema calcula el valor según el tipo de corte, barba y cejas.",
    icon: Sparkles,
  },
  {
    title: "Persistencia",
    description: "Las reservas quedan guardadas en PostgreSQL para administración posterior.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid flex-1 gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--accent)] shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#d97706]" />
            Barbería Stiven - agenda digital con precios automáticos
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm backdrop-blur">
            <MapPin className="h-4 w-4 text-[var(--accent)]" />
            Conquistadores, El Peñol, Antioquia
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/barbero"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:border-[var(--accent)]"
            >
              Ver panel del barbero
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Ver panel admin
            </Link>
          </div>

          <div className="space-y-5">
            <h1 className="max-w-2xl text-5xl leading-none text-[var(--foreground)] sm:text-6xl lg:text-7xl">
              Reserva tu cita en Barbería Stiven con una experiencia clara y rápida.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--muted)] sm:text-xl">
              El cliente elige el estilo, añade barba o cejas, selecciona la fecha y la hora, y recibe un valor estimado antes de confirmar la cita.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-3xl border border-[var(--border)] bg-white/70 p-5 shadow-sm backdrop-blur"
              >
                <div className="mb-4 inline-flex rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="lg:pl-6">
          <div className="rounded-[2rem] border border-white/70 bg-[var(--surface)] p-4 shadow-glow backdrop-blur-xl sm:p-6">
            <BookingForm />
          </div>
        </div>
      </section>
    </main>
  );
}
