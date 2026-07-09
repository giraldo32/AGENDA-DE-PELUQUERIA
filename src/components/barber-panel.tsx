"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { MapPin, RefreshCcw, Scissors, X } from "lucide-react";
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
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  const loadCitas = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setMessage("");
    }
    try {
      const response = await fetch("/api/barbero/citas");
      if (!response.ok) {
        setMessage("No se pudieron cargar las citas.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      const data = await readJsonResponse<{ citas: Cita[] }>(response);
      setCitas(data.citas);
    } catch (error) {
      console.error("Error al cargar citas:", error);
      setMessage("Error de conexión al cargar las citas.");
      setMessageType("error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCitas();
  }, [loadCitas]);

  async function cancelarCita(id: string) {
    const confirmacion = window.confirm("¿Estás seguro de cancelar esta cita? El cliente será notificado.");
    if (!confirmacion) return;

    const response = await fetch(`/api/bookings/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "CANCELADA" }),
    });

    if (!response.ok) {
      setMessage("No se pudo cancelar la cita.");
      setMessageType("error");
      return;
    }

    setMessage("Cita cancelada correctamente.");
    setMessageType("success");
    await loadCitas();
  }

  function statusStyle(status: string) {
    switch (status) {
      case "CONFIRMADA":
        return "bg-emerald-100 text-emerald-900";
      case "CANCELADA":
        return "bg-rose-100 text-rose-900";
      default:
        return "bg-amber-100 text-amber-900";
    }
  }

  if (loading) {
    return <Shell>Cargando agenda del barbero...</Shell>;
  }

  return (
    <Shell>
      <div className="app-card mx-auto w-full max-w-6xl space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-lg bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
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
            onClick={() => void loadCitas(true)}
            disabled={refreshing}
            className="btn btn-secondary"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Actualizando..." : "Actualizar"}
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

        {message ? (
          <p className={`text-sm ${messageType === "success" ? "text-emerald-700" : "text-rose-700"}`}>
            {message}
          </p>
        ) : null}

        <div className="table-shell">
          <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Notas</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
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
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(cita.estado)}`}>
                      {cita.estado}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => void cancelarCita(cita.id)}
                      className="btn btn-danger btn-sm"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancelar
                    </button>
                  </td>
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
    <div className="stat-card">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
