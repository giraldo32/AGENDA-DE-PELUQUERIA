"use client";

import type { ComponentType, FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, LoaderCircle, Phone, User } from "lucide-react";
import { availableTimeSlots, estimateHaircutPrice } from "@/lib/pricing";
import { beardAddOnPrice, eyebrowsAddOnPrice } from "@/lib/pricing";
import { readJsonResponse } from "@/lib/http";

type AvailabilityResponse = {
  bookedTimes: string[];
};

const initialDate = new Date().toISOString().slice(0, 10);

export function BookingForm() {
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [haircutType, setHaircutType] = useState("");
  const [includeBeard, setIncludeBeard] = useState(false);
  const [includeEyebrows, setIncludeEyebrows] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(initialDate);
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submissionState, setSubmissionState] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [isSaving, setIsSaving] = useState(false);

  const estimate = useMemo(
    () =>
      estimateHaircutPrice({
        haircutType,
        includeBeard,
        includeEyebrows,
      }),
    [haircutType, includeBeard, includeEyebrows],
  );

  const refreshAvailability = useCallback(async () => {
    setLoadingAvailability(true);
    try {
      const response = await fetch(`/api/availability?date=${appointmentDate}`);
      if (!response.ok) {
        throw new Error("No se pudo consultar la disponibilidad");
      }

      const data = await readJsonResponse<AvailabilityResponse>(response);
      setBookedTimes(data.bookedTimes);
      if (data.bookedTimes.includes(appointmentTime)) {
        setAppointmentTime("");
      }
    } catch {
      setBookedTimes([]);
    } finally {
      setLoadingAvailability(false);
    }
  }, [appointmentDate, appointmentTime]);

  useEffect(() => {
    void refreshAvailability();
  }, [refreshAvailability]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSubmissionState({ type: "idle", message: "" });

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombreCliente: clientName,
          telefono: phone,
          tipoCorte: haircutType,
          incluyeBarba: includeBeard,
          incluyeCejas: includeEyebrows,
          fechaCita: appointmentDate,
          horaCita: appointmentTime,
          notas: notes,
        }),
      });

      const result = await readJsonResponse<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(result.message ?? "No se pudo crear la reserva");
      }

      setSubmissionState({
        type: "success",
        message: "Reserva creada correctamente. Tu cita quedó guardada.",
      });
      setAppointmentTime("");
      setNotes("");
      await refreshAvailability();
    } catch (error) {
      setSubmissionState({
        type: "error",
        message: error instanceof Error ? error.message : "Ocurrió un error inesperado",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Reserva tu cita</p>
        <h2 className="text-3xl text-[var(--foreground)]">Agenda en pocos pasos</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre completo" icon={User}>
          <input
            required
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            className="input"
            placeholder="Juan Pérez"
          />
        </Field>

        <Field label="Teléfono" icon={Phone}>
          <input
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="input"
            placeholder="3001234567"
          />
        </Field>
      </div>

      <Field label="Tipo de corte">
        <input
          required
          value={haircutType}
          onChange={(event) => setHaircutType(event.target.value)}
          className="input"
          placeholder="Ej. fade con diseño, clásico, degradado..."
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="option-card">
          <input
            type="checkbox"
            checked={includeBeard}
            onChange={(event) => setIncludeBeard(event.target.checked)}
          />
          <span>
            <strong className="flex items-center justify-between gap-3">
              <span>Barba</span>
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                +${beardAddOnPrice.toLocaleString("es-CO")}
              </span>
            </strong>
            <small>Agrega el servicio de barba al total</small>
          </span>
        </label>

        <label className="option-card">
          <input
            type="checkbox"
            checked={includeEyebrows}
            onChange={(event) => setIncludeEyebrows(event.target.checked)}
          />
          <span>
            <strong className="flex items-center justify-between gap-3">
              <span>Cejas</span>
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                +${eyebrowsAddOnPrice.toLocaleString("es-CO")}
              </span>
            </strong>
            <small>Incluye perfilado de cejas</small>
          </span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Fecha" icon={CalendarDays}>
          <input
            required
            type="date"
            value={appointmentDate}
            onChange={(event) => setAppointmentDate(event.target.value)}
            className="input"
          />
        </Field>

        <Field label="Hora" icon={Clock3}>
          <select
            required
            value={appointmentTime}
            onChange={(event) => setAppointmentTime(event.target.value)}
            className="input"
          >
            <option value="">Selecciona una hora</option>
            {availableTimeSlots.map((slot) => (
              <option key={slot} value={slot} disabled={bookedTimes.includes(slot)}>
                {slot} {bookedTimes.includes(slot) ? "(ocupado)" : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Notas opcionales">
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="input min-h-24 resize-none"
          placeholder="Preferencias del cliente, detalles del corte, etc."
        />
      </Field>

      <div className="rounded-3xl border border-[var(--border)] bg-[#102018] p-5 text-white shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-white/60">Valor estimado</p>
            <p className="mt-2 text-4xl font-semibold">${estimate.estimatedPrice.toLocaleString("es-CO")}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80">
            {loadingAvailability ? "Consultando horarios..." : `${availableTimeSlots.length - bookedTimes.length} horarios libres`}
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Base: ${estimate.basePrice.toLocaleString("es-CO")} | Barba: ${estimate.breakdown.beardAddOn.toLocaleString("es-CO")} | Cejas: ${estimate.breakdown.eyebrowsAddOn.toLocaleString("es-CO")}
        </p>
      </div>

      {submissionState.type !== "idle" && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            submissionState.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {submissionState.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-4 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
        Confirmar cita
      </button>
    </form>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
        {Icon ? <Icon className="h-4 w-4 text-[var(--accent)]" /> : null}
        {label}
      </div>
      {children}
    </label>
  );
}
