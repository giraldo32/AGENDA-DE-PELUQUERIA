"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { MapPin, RefreshCcw, Scissors } from "lucide-react";
import { readJsonResponse } from "@/lib/http";

type Cita = {
  id: string;
  nombreCliente: string;
  telefono: string;
  tipoCorte: string;
  incluyeBarba: boolean;
  incluyeCejas: boolean;
  fechaCita: string;
  horaCita: string;
  notas?: string | null;
  precioEstimado: number;
  estado: string;
};

export function BarberPanel() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadCitas = useCallback(async () => {
    const response = await fetch("/api/barbero/citas");
    if (!response.ok) {
      setMessage("No se pudieron cargar las citas.");
      setLoading(false);
      return;
    }

    const data = await readJsonResponse<{ citas: Cita[] }>(response);
    setCitas(data.citas);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadCitas();
  }, [loadCitas]);

  if (loading) {
    return <Shell>Cargando agenda del barbero...</Shell>;
  }

  return (
    <Shell>
      <div className="mx-auto w-full max-w-6xl space-y-6 rounded-[2rem] border border-[var(--border)] bg-white/80 p-6 shadow-glow backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
              <Scissors className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Panel barbero</p>
            <h1 className="text-4xl text-[var(--foreground)]">Agenda de clientes</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Vista de solo lectura para revisar citas agendadas, servicios y observaciones.
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm text-[var(--foreground)]">
              <MapPin className="h-4 w-4 text-[var(--accent)]" />
              Conquistadores, El Peñol, Antioquia
            </p>
          </div>
          <button
            onClick={loadCitas}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold"
          >
            <RefreshCcw className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Stat label="Citas del día" value={citas.length.toString()} />
          <Stat
            label="Servicios con barba"
            value={`${citas.filter((cita) => cita.incluyeBarba).length}`}
          />
          <Stat
            label="Servicios con cejas"
            value={`${citas.filter((cita) => cita.incluyeCejas).length}`}
          />
        </div>

        {message ? <p className="text-sm text-rose-700">{message}</p> : null}

        <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-white">
          <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
            <thead className="bg-[#f5f0e6] text-[var(--foreground)]">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Notas</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {citas.map((cita) => (
                <tr key={cita.id}>
                  <td className="px-4 py-4">
                    <div className="font-semibold">{cita.nombreCliente}</div>
                    <div className="text-xs text-[var(--muted)]">{cita.telefono}</div>
                    <div className="text-xs text-[var(--muted)]">{cita.fechaCita}</div>
                  </td>
                  <td className="px-4 py-4">{cita.horaCita}</td>
                  <td className="px-4 py-4">
                    {cita.tipoCorte}
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {cita.incluyeBarba ? "Barba " : ""}
                      {cita.incluyeCejas ? "Cejas" : ""}
                      {!cita.incluyeBarba && !cita.incluyeCejas ? "Sin extras" : ""}
                    </div>
                  </td>
                  <td className="px-4 py-4">{cita.notas ?? "Sin notas"}</td>
                  <td className="px-4 py-4 font-semibold">${cita.precioEstimado.toLocaleString("es-CO")}</td>
                  <td className="px-4 py-4">{cita.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <main className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">{children}</main>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.75rem] border border-[var(--border)] bg-white px-5 py-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
