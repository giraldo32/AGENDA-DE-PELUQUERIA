"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { Check, History, KeyRound, LockKeyhole, LogOut, RefreshCcw, Trash2, X } from "lucide-react";
import { readJsonResponse } from "@/lib/http";

type Booking = {
  id: string;
  nombreCliente: string;
  telefono: string;
  tipoCorte: string;
  incluyeBarba: boolean;
  incluyeCejas: boolean;
  profesional?: string;
  fechaCita: string;
  horaCita: string;
  notas?: string | null;
  precioEstimado: number;
  estado: string;
  fechaCreacion: string;
};

type ClientSummary = {
  id: string;
  nombre: string;
  telefono: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  citas?: Array<{
    id: string;
    estado: string;
    fechaCita: string;
    horaCita: string;
  }>;
  _count: {
    citas: number;
    historialServicios: number;
  };
};

type HistoryRecord = {
  id: string;
  fechaServicio: string;
  horaServicio: string;
  servicioRealizado: string;
  profesional: string;
  precioServicio: number;
  observaciones?: string | null;
  estado: string;
};

type BookingStatus = "PENDIENTE" | "CONFIRMADA" | "CANCELADA";

type BannerState = {
  type: "idle" | "success" | "error";
  message: string;
};

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

function bannerStyle(type: BannerState["type"]) {
  return type === "success" ? "text-emerald-700" : "text-rose-700";
}

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);
  const [clientHistory, setClientHistory] = useState<HistoryRecord[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [banner, setBanner] = useState<BannerState>({ type: "idle", message: "" });
  const [loginForm, setLoginForm] = useState({ usuario: "admin", contrasena: "admin" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const loadSession = useCallback(async () => {
    const response = await fetch("/api/auth/me");
    setIsAuthenticated(response.ok);
    setLoading(false);
  }, []);

  const loadBookings = useCallback(async () => {
    const response = await fetch("/api/bookings");
    if (!response.ok) {
      setBanner({ type: "error", message: "No se pudieron cargar las reservas." });
      return;
    }

    const data = await readJsonResponse<{ citas: Booking[] }>(response);
    setBookings(data.citas);
  }, []);

  const loadClients = useCallback(async () => {
    const response = await fetch("/api/clientes");
    if (!response.ok) {
      setBanner({ type: "error", message: "No se pudieron cargar los clientes." });
      return;
    }

    const data = await readJsonResponse<{ clientes: ClientSummary[] }>(response);
    setClients(data.clientes);
  }, []);

  const loadDashboardData = useCallback(async () => {
    await Promise.all([loadBookings(), loadClients()]);
  }, [loadBookings, loadClients]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadDashboardData();
    }
  }, [isAuthenticated, loadDashboardData]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setBanner({ type: "idle", message: "" });

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm),
    });

    if (!response.ok) {
      const error = await readJsonResponse<{ message?: string }>(response);
      setBanner({ type: "error", message: error.message ?? "Credenciales inválidas" });
      setAuthLoading(false);
      return;
    }

    setIsAuthenticated(true);
    setAuthLoading(false);
    await loadDashboardData();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    setBookings([]);
    setClients([]);
    setClientHistory([]);
    setSelectedClient(null);
    setIsHistoryOpen(false);
    setBanner({ type: "idle", message: "" });
  }

  async function refreshBookings() {
    await loadDashboardData();
  }

  async function updateBookingStatus(id: string, estado: BookingStatus) {
    const response = await fetch(`/api/bookings/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });

    if (!response.ok) {
      const error = await readJsonResponse<{ message?: string }>(response);
      setBanner({ type: "error", message: error.message ?? "No se pudo actualizar el estado." });
      return;
    }

    setBanner({
      type: "success",
      message: estado === "CONFIRMADA" ? "Cita confirmada correctamente." : "Cita cancelada correctamente.",
    });
    await loadBookings();
  }

  async function openHistory(client: ClientSummary) {
    setSelectedClient(client);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    setClientHistory([]);
    setBanner({ type: "idle", message: "" });

    const response = await fetch(`/api/clientes/${client.id}/historial`);
    if (!response.ok) {
      const error = await readJsonResponse<{ message?: string }>(response);
      setBanner({ type: "error", message: error.message ?? "No se pudo cargar el historial." });
      setHistoryLoading(false);
      return;
    }

    const data = await readJsonResponse<{ historial: HistoryRecord[] }>(response);
    setClientHistory(data.historial);
    setHistoryLoading(false);
  }

  async function deleteClient(client: ClientSummary) {
    const confirmed = window.confirm(
      `¿Eliminar a ${client.nombre}? Esta acción borrará su información, citas activas e historial asociado.`,
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/clientes/${client.id}`, { method: "DELETE" });
    if (!response.ok) {
      const error = await readJsonResponse<{ message?: string }>(response);
      setBanner({ type: "error", message: error.message ?? "No se pudo eliminar el cliente." });
      return;
    }

    setBanner({ type: "success", message: "Cliente eliminado correctamente." });
    setClients((current) => current.filter((item) => item.id !== client.id));
    if (selectedClient?.id === client.id) {
      setSelectedClient(null);
      setClientHistory([]);
      setIsHistoryOpen(false);
    }
    await loadBookings();
  }

  async function confirmClientAppointment(client: ClientSummary) {
    const response = await fetch(`/api/clientes/${client.id}/confirmar`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await readJsonResponse<{ message?: string }>(response);
      setBanner({ type: "error", message: error.message ?? "No se pudo confirmar la cita." });
      return;
    }

    setBanner({ type: "success", message: "Cita confirmada correctamente." });
    await loadDashboardData();
  }

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordLoading(true);
    setBanner({ type: "idle", message: "" });

    if (passwordForm.newPassword.length < 8) {
      setBanner({ type: "error", message: "La nueva contraseña debe tener al menos 8 caracteres." });
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setBanner({ type: "error", message: "Las contraseñas nuevas no coinciden." });
      setPasswordLoading(false);
      return;
    }

    const response = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwordForm),
    });

    if (!response.ok) {
      const error = await readJsonResponse<{ message?: string }>(response);
      setBanner({ type: "error", message: error.message ?? "No se pudo cambiar la contraseña." });
      setPasswordLoading(false);
      return;
    }

    setBanner({ type: "success", message: "Contraseña actualizada correctamente." });
    setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    setPasswordLoading(false);
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
            {banner.message ? <p className={`text-sm ${bannerStyle(banner.type)}`}>{banner.message}</p> : null}
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

        {banner.message ? <p className={`text-sm ${bannerStyle(banner.type)}`}>{banner.message}</p> : null}

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
              {bookings.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-[var(--muted)]" colSpan={7}>
                    No hay citas para hoy.
                  </td>
                </tr>
              ) : null}
              {bookings.map((cita) => (
                <tr key={cita.id}>
                  <td className="px-4 py-4">
                    <div className="font-semibold">{cita.nombreCliente}</div>
                    <div className="text-xs text-[var(--muted)]">{cita.telefono}</div>
                  </td>
                  <td className="px-4 py-4">
                    {cita.fechaCita} {cita.horaCita}
                  </td>
                  <td className="px-4 py-4">
                    {cita.tipoCorte}
                    {cita.profesional ? <div className="mt-1 text-xs text-[var(--muted)]">{cita.profesional}</div> : null}
                  </td>
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

        <section className="space-y-4 rounded-[1.75rem] border border-[var(--border)] bg-white p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Clientes</p>
              <h2 className="text-2xl text-[var(--foreground)]">Gestión de clientes</h2>
            </div>
            <p className="text-sm text-[var(--muted)]">El listado se actualiza después de eliminar un cliente o refrescar la agenda.</p>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)]">
            <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
              <thead className="bg-[#f5f0e6] text-[var(--foreground)]">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Citas</th>
                  <th className="px-4 py-3">Historial</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {clients.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-[var(--muted)]" colSpan={5}>
                      No hay clientes registrados todavía.
                    </td>
                  </tr>
                ) : null}
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-[var(--foreground)]">{client.nombre}</div>
                      <div className="text-xs text-[var(--muted)]">Actualizado {client.fechaActualizacion.slice(0, 10)}</div>
                    </td>
                    <td className="px-4 py-4">{client.telefono}</td>
                    <td className="px-4 py-4 font-semibold">{client._count.citas}</td>
                    <td className="px-4 py-4 font-semibold">{client._count.historialServicios}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => void confirmClientAppointment(client)}
                          disabled={(client.citas?.length ?? 0) === 0}
                          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Confirmar cita
                        </button>
                        <button
                          onClick={() => void openHistory(client)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                        >
                          <History className="h-3.5 w-3.5" />
                          Ver historial
                        </button>
                        <button
                          onClick={() => void deleteClient(client)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar cliente
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 rounded-[1.75rem] border border-[var(--border)] bg-white p-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Configuración</p>
            <h2 className="text-2xl text-[var(--foreground)]">Cambiar contraseña</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              La nueva contraseña se valida con la actual, debe coincidir en ambos campos y queda almacenada únicamente como hash.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handlePasswordChange}>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="input"
                type="password"
                placeholder="Contraseña actual"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
              />
              <input
                className="input"
                type="password"
                placeholder="Nueva contraseña"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
              />
            </div>
            <input
              className="input"
              type="password"
              placeholder="Repite la nueva contraseña"
              value={passwordForm.confirmNewPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, confirmNewPassword: event.target.value }))}
            />
            <button
              type="submit"
              disabled={passwordLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#102018] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" />
              {passwordLoading ? "Actualizando..." : "Cambiar contraseña"}
            </button>
          </form>
        </section>
      </div>

      {isHistoryOpen && selectedClient ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-4xl rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-2xl">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Historial del cliente</p>
                <h2 className="text-2xl text-[var(--foreground)]">{selectedClient.nombre}</h2>
                <p className="text-sm text-[var(--muted)]">{selectedClient.telefono}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsHistoryOpen(false);
                  setSelectedClient(null);
                  setClientHistory([]);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold"
              >
                <X className="h-4 w-4" />
                Cerrar
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[var(--border)]">
              {historyLoading ? (
                <div className="p-6 text-sm text-[var(--muted)]">Cargando historial...</div>
              ) : clientHistory.length === 0 ? (
                <div className="p-6 text-sm text-[var(--muted)]">Este cliente todavía no tiene historial registrado.</div>
              ) : (
                <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
                  <thead className="bg-[#f5f0e6] text-[var(--foreground)]">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Hora</th>
                      <th className="px-4 py-3">Servicio</th>
                      <th className="px-4 py-3">Profesional</th>
                      <th className="px-4 py-3">Precio</th>
                      <th className="px-4 py-3">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {clientHistory.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4">{item.fechaServicio}</td>
                        <td className="px-4 py-4">{item.horaServicio}</td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-[var(--foreground)]">{item.servicioRealizado}</div>
                          <div className="mt-1 inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                            {item.estado}
                          </div>
                        </td>
                        <td className="px-4 py-4">{item.profesional}</td>
                        <td className="px-4 py-4 font-semibold">${item.precioServicio.toLocaleString("es-CO")}</td>
                        <td className="px-4 py-4 text-sm text-[var(--muted)]">{item.observaciones ?? "Sin observaciones"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : null}
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
