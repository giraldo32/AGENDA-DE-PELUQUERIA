import { BookingForm } from "@/components/booking-form";
import { CalendarCheck, MapPin, Scissors, ShieldCheck, Sparkles } from "lucide-react";
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
      <section className="grid flex-1 gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <div className="space-y-7">
          <div className="flex flex-wrap gap-3">
            <span className="badge-soft">
              <CalendarCheck className="mr-2 h-4 w-4" />
              Agenda digital
            </span>
            <span className="badge-soft bg-white text-[var(--foreground)]">
              <MapPin className="h-4 w-4 text-[var(--accent)]" />
              Conquistadores, El Peñol, Antioquia
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/barbero" className="btn btn-secondary">
              Ver panel del barbero
            </Link>
            <Link href="/admin" className="btn btn-primary">
              Ver panel admin
            </Link>
          </div>

          <div className="space-y-5">
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Barbería Stiven
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--muted)] sm:text-xl">
              Reserva tu cita con una experiencia clara: servicio, fecha, hora y valor estimado antes de confirmar.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map(({ title, description, icon: Icon }) => (
              <article key={title} className="section-card">
                <div className="mb-4 inline-flex rounded-lg bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="lg:pl-6">
          <div className="app-card p-4 sm:p-6">
            <BookingForm />
          </div>
        </div>
      </section>
    </main>
  );
}
