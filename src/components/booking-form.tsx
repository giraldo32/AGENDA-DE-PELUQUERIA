"use client";

import type { ComponentType, FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Eye, LoaderCircle, MapPin, Phone, Plus, Scissors, Sparkles, User } from "lucide-react";
import { availableTimeSlots, beardAddOnPrice, eyebrowsAddOnPrice, estimateHaircutPrice, haircutPackages } from "@/lib/pricing";
import { readJsonResponse } from "@/lib/http";

type AvailabilityResponse = {
  bookedTimes: string[];
};

type BookingResponse = {
  cita: {
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
};

type ServiceKey = (typeof haircutPackages)[number]["key"];

const serviceByKey = Object.fromEntries(haircutPackages.map((option) => [option.key, option])) as Record<
  ServiceKey,
  (typeof haircutPackages)[number]
>;

const initialDate = new Date().toISOString().slice(0, 10);

function toggleBeard(service: ServiceKey): ServiceKey {
  switch (service) {
    case "corte":
    case "corte-completo":
      return "solo-barba";
    case "solo-barba":
      return "corte";
    case "solo-cejas":
      return "base-barba-cejas";
    case "base":
      return "base-barba";
    case "base-barba":
      return "base";
    case "base-cejas":
      return "base-barba-cejas";
    case "base-barba-cejas":
    case "corte-y-barba":
    case "barba-y-cejas":
      // Quitando barba, volvemos a la variante sin barba equivalente
      return "base-cejas";
    default:
      return service;
  }
}

function toggleEyebrows(service: ServiceKey): ServiceKey {
  switch (service) {
    case "corte":
    case "corte-completo":
      return "solo-cejas";
    case "solo-cejas":
      return "corte";
    case "solo-barba":
      return "base-barba-cejas";
    case "base":
      return "base-cejas";
    case "base-cejas":
      return "base";
    case "base-barba":
      return "base-barba-cejas";
    case "base-barba-cejas":
    case "corte-y-barba":
    case "barba-y-cejas":
      // Quitando cejas, volvemos a la variante equivalente sin cejas
      return "base-barba";
    default:
      return service;
  }
}

export function BookingForm() {
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceKey>("base");
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
  const [savedBooking, setSavedBooking] = useState<BookingResponse["cita"] | null>(null);
  const [showSavedBooking, setShowSavedBooking] = useState(false);

  const estimate = useMemo(
    () =>
      estimateHaircutPrice({
        haircutType: serviceByKey[selectedService].label,
        includeBeard: selectedService === "base-barba" || selectedService === "base-barba-cejas",
        includeEyebrows: selectedService === "base-cejas" || selectedService === "base-barba-cejas",
      }),
    [selectedService],
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
          tipoCorte: serviceByKey[selectedService].label,
          incluyeBarba: selectedService === "base-barba" || selectedService === "base-barba-cejas",
          incluyeCejas: selectedService === "base-cejas" || selectedService === "base-barba-cejas",
          fechaCita: appointmentDate,
          horaCita: appointmentTime,
          notas: notes,
        }),
      });

      const result = await readJsonResponse<BookingResponse & { message?: string }>(response);

      if (!response.ok) {
        throw new Error(result.message ?? "No se pudo crear la reserva");
      }

      setSubmissionState({
        type: "success",
        message: "Reserva creada correctamente. Tu cita quedó guardada.",
      });
      setSavedBooking(result.cita);
      setShowSavedBooking(true);
      setSelectedService("base");
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
        <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <MapPin className="h-4 w-4 text-[var(--accent)]" />
          Barbería Stiven, Conquistadores, El Peñol, Antioquia
        </p>
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

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <Scissors className="h-4 w-4 text-[var(--accent)]" />
          Escoge tu servicio
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {haircutPackages.map((option) => {
            const active = selectedService === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedService(option.key)}
                className={`rounded-3xl border p-4 text-left transition ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm"
                    : "border-[var(--border)] bg-white/80 hover:border-[var(--accent)] hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{option.label}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">Estilo predefinido para una reserva rápida</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--accent)] shadow-sm">
                    ${option.price.toLocaleString("es-CO")}
                  </span>
                </div>
                {active ? <p className="mt-3 text-xs font-medium text-[var(--accent)]">Seleccionado</p> : null}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button type="button" onClick={() => setSelectedService(toggleBeard(selectedService))} className="option-card text-left">
            <span className="mt-1 inline-flex rounded-2xl bg-[var(--accent-soft)] p-2 text-[var(--accent)]">
              <Plus className="h-4 w-4" />
            </span>
            <span>
              <strong className="flex items-center justify-between gap-3">
                <span>Adicional de barba</span>
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                  +${beardAddOnPrice.toLocaleString("es-CO")}
                </span>
              </strong>
              <small>Activa o quita barba dentro del estilo seleccionado</small>
            </span>
          </button>

          <button type="button" onClick={() => setSelectedService(toggleEyebrows(selectedService))} className="option-card text-left">
            <span className="mt-1 inline-flex rounded-2xl bg-[var(--accent-soft)] p-2 text-[var(--accent)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>
              <strong className="flex items-center justify-between gap-3">
                <span>Adicional de cejas</span>
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                  +${eyebrowsAddOnPrice.toLocaleString("es-CO")}
                </span>
              </strong>
              <small>Agrega o quita cejas en un toque</small>
            </span>
          </button>
        </div>
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

      {savedBooking ? (
        <div className="rounded-[2rem] border border-[var(--border)] bg-white/85 p-5 shadow-sm">
          <button
            type="button"
            onClick={() => setShowSavedBooking((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
          >
            <Eye className="h-4 w-4" />
            Ver mi cita agendada
          </button>

          {showSavedBooking ? (
            <div className="mt-4 space-y-3 rounded-3xl bg-[var(--accent-soft)] p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--accent)]">
                <CheckCircle2 className="h-4 w-4" />
                Cita guardada correctamente
              </div>
              <p className="text-sm text-[var(--foreground)]">
                {savedBooking.nombreCliente} - {savedBooking.fechaCita} a las {savedBooking.horaCita}
              </p>
              <p className="text-sm text-[var(--foreground)]">Servicio: {savedBooking.tipoCorte}</p>
              <p className="text-sm text-[var(--foreground)]">
                Estado: <strong>{savedBooking.estado}</strong>
              </p>
              <p className="text-sm text-[var(--foreground)]">Dirección: Conquistadores, El Peñol, Antioquia</p>
            </div>
          ) : null}
        </div>
      ) : null}
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
