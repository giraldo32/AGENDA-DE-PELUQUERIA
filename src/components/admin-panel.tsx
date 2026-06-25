"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { Check, LockKeyhole, LogOut, RefreshCcw, X } from "lucide-react";
import { readJsonResponse } from "@/lib/http";

type Booking = {
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
  fechaCreacion: string;
};

type BookingStatus = "PENDIENTE" | "CONFIRMADA" | "CANCELADA";

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

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loginForm, setLoginForm] = useState({ usuario: "admin", contrasena: "admin" });

  const loadSession = useCallback(async () => {
    const response = await fetch("/api/auth/me");
    setIsAuthenticated(response.ok);
    setLoading(false);
  }, []);

  const loadBookings = useCallback(async () => {
    const response = await fetch("/api/bookings");
    if (!response.ok) {
      setMessage("No se pudieron cargar las reservas.");
      return;
    }

    const data = await readJsonResponse<{ citas: Booking[] }>(response);
    setBookings(data.citas);
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadBookings();
    }
  }, [isAuthenticated, loadBookings]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm),
    });

    if (!response.ok) {
      const error = await readJsonResponse<{ message?: string }>(response);
      setMessage(error.message ?? "Credenciales inválidas");
      setAuthLoading(false);
      return;
    }

    setIsAuthenticated(true);
    setAuthLoading(false);
    await loadBookings();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    setBookings([]);
  }

  async function refreshBookings() {
    await loadBookings();
  }

  async function updateBookingStatus(id: string, estado: BookingStatus) {
    const response = await fetch(`/api/bookings/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });

    if (!response.ok) {
      const error = await readJsonResponse<{ message?: string }>(response);
      setMessage(error.message ?? "No se pudo actualizar el estado.");
      return;
    }

    setMessage(estado === "CONFIRMADA" ? "Cita confirmada correctamente." : "Cita cancelada correctamente.");
    await loadBookings();
  }

  if (loading) {
    return <Shell>Validando sesión...</Shell>;
  }

  if (!isAuthenticated) {
    return (
      <Shell>
        <div className="mx-auto w-full max-w-md rounded-[2rem] border border-[var(--border)] bg-white/80 p-6 shadow-glow backdrop-blur">
          <div className="mb-6 inline-flex rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="text-4xl text-[var(--foreground)]">Ingreso de administrador</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Usa las credenciales iniciales <strong>admin / admin</strong> para entrar y ver las reservas.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <input
              className="input"
              placeholder="Usuario"
              value={loginForm.usuario}
              onChange={(event) => setLoginForm((current) => ({ ...current, usuario: event.target.value }))}
            />
            <input
              className="input"
              type="password"
              placeholder="Contraseña"
              value={loginForm.contrasena}
              onChange={(event) => setLoginForm((current) => ({ ...current, contrasena: event.target.value }))}
            />
            {message ? <p className="text-sm text-rose-700">{message}</p> : null}
            <button
              type="submit"
              disabled={authLoading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white"
            >
              {authLoading ? "Ingresando..." : "Entrar"}
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto w-full max-w-6xl space-y-6 rounded-[2rem] border border-[var(--border)] bg-white/80 p-6 shadow-glow backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Panel admin</p>
            <h1 className="text-4xl text-[var(--foreground)]">Reservas de la peluquería</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refreshBookings}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold"
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#102018] px-4 py-3 text-sm font-semibold text-white"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Stat label="Citas" value={bookings.length.toString()} />
          <Stat
            label="Ingresos estimados"
            value={`$${bookings.reduce((sum, booking) => sum + booking.precioEstimado, 0).toLocaleString("es-CO")}`}
          />
          <Stat
            label="Servicios activos"
            value={`${bookings.filter((booking) => booking.incluyeBarba || booking.incluyeCejas).length}`}
          />
        </div>

        {message ? <p className="text-sm text-rose-700">{message}</p> : null}

        <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-white">
          <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
            <thead className="bg-[#f5f0e6] text-[var(--foreground)]">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Cita</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Extras</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {bookings.map((cita) => (
                <tr key={cita.id}>
                  <td className="px-4 py-4">
                    <div className="font-semibold">{cita.nombreCliente}</div>
                    <div className="text-xs text-[var(--muted)]">{cita.telefono}</div>
                  </td>
                  <td className="px-4 py-4">
                    {cita.fechaCita} {cita.horaCita}
                  </td>
                  <td className="px-4 py-4">{cita.tipoCorte}</td>
                  <td className="px-4 py-4">
                    {cita.incluyeBarba ? "Barba " : ""}
                    {cita.incluyeCejas ? "Cejas" : ""}
                    {!cita.incluyeBarba && !cita.incluyeCejas ? "Ninguno" : ""}
                  </td>
                  <td className="px-4 py-4 font-semibold">${cita.precioEstimado.toLocaleString("es-CO")}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(cita.estado)}`}>
                      {cita.estado}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateBookingStatus(cita.id, "CONFIRMADA")}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Confirmar
                      </button>
                      <button
                        onClick={() => updateBookingStatus(cita.id, "CANCELADA")}
                        className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancelar
                      </button>
                    </div>
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
    <div className="rounded-[1.75rem] border border-[var(--border)] bg-white px-5 py-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
