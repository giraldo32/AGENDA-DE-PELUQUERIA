type BookingNotification = {
  nombreCliente: string;
  telefono: string;
  correo?: string | null;
  tipoCorte: string;
  fechaCita: string;
  horaCita: string;
  precioEstimado: number;
  notas?: string | null;
};

type NotificationResult = {
  channel: "email" | "sms";
  target: string;
  ok: boolean;
  skipped?: boolean;
  error?: string;
};

const BUSINESS_NAME = process.env.BUSINESS_NAME || "Barbería Stiven";
const BUSINESS_ADDRESS = process.env.BUSINESS_ADDRESS || "Conquistadores, El Peñol, Antioquia";

function money(value: number) {
  return `$${value.toLocaleString("es-CO")}`;
}

function buildTextMessage(booking: BookingNotification, recipient: "cliente" | "barbero") {
  const heading =
    recipient === "cliente"
      ? `Hola ${booking.nombreCliente}, tu cita en ${BUSINESS_NAME} quedó registrada.`
      : `Nueva cita registrada en ${BUSINESS_NAME}.`;

  return [
    heading,
    `Fecha: ${booking.fechaCita}`,
    `Hora: ${booking.horaCita}`,
    `Servicio: ${booking.tipoCorte}`,
    `Precio estimado: ${money(booking.precioEstimado)}`,
    `Dirección: ${BUSINESS_ADDRESS}`,
    recipient === "barbero" ? `Cliente: ${booking.nombreCliente} - ${booking.telefono}` : null,
    booking.notas ? `Notas: ${booking.notas}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildEmailHtml(booking: BookingNotification, recipient: "cliente" | "barbero") {
  const intro =
    recipient === "cliente"
      ? `Hola ${escapeHtml(booking.nombreCliente)}, tu cita quedó registrada.`
      : `Se registró una nueva cita para ${escapeHtml(booking.nombreCliente)}.`;

  return `
    <div style="font-family: Arial, sans-serif; color: #10233f; line-height: 1.5;">
      <h2 style="color: #1e40af;">${BUSINESS_NAME}</h2>
      <p>${intro}</p>
      <ul>
        <li><strong>Fecha:</strong> ${escapeHtml(booking.fechaCita)}</li>
        <li><strong>Hora:</strong> ${escapeHtml(booking.horaCita)}</li>
        <li><strong>Servicio:</strong> ${escapeHtml(booking.tipoCorte)}</li>
        <li><strong>Precio estimado:</strong> ${money(booking.precioEstimado)}</li>
        <li><strong>Dirección:</strong> ${escapeHtml(BUSINESS_ADDRESS)}</li>
        ${recipient === "barbero" ? `<li><strong>Teléfono:</strong> ${escapeHtml(booking.telefono)}</li>` : ""}
        ${booking.notas ? `<li><strong>Notas:</strong> ${escapeHtml(booking.notas)}</li>` : ""}
      </ul>
    </div>
  `;
}

function normalizePhone(phone: string) {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, "");
  const defaultCountryCode = process.env.DEFAULT_PHONE_COUNTRY_CODE || "+57";

  if (digits.length === 10) {
    return `${defaultCountryCode}${digits}`;
  }

  return digits ? `${defaultCountryCode}${digits}` : "";
}

async function sendEmail(to: string, subject: string, text: string, html: string): Promise<NotificationResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;

  if (!apiKey || !from) {
    return { channel: "email", target: to, ok: false, skipped: true, error: "Correo no configurado" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      return { channel: "email", target: to, ok: false, error: await response.text() };
    }

    return { channel: "email", target: to, ok: true };
  } catch (error) {
    return { channel: "email", target: to, ok: false, error: error instanceof Error ? error.message : "Error enviando correo" };
  }
}

async function sendSms(to: string, body: string): Promise<NotificationResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_PHONE;
  const normalizedTo = normalizePhone(to);

  if (!accountSid || !authToken || !from) {
    return { channel: "sms", target: normalizedTo || to, ok: false, skipped: true, error: "SMS no configurado" };
  }

  if (!normalizedTo) {
    return { channel: "sms", target: to, ok: false, skipped: true, error: "Teléfono vacío" };
  }

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: from,
        To: normalizedTo,
        Body: body,
      }),
    });

    if (!response.ok) {
      return { channel: "sms", target: normalizedTo, ok: false, error: await response.text() };
    }

    return { channel: "sms", target: normalizedTo, ok: true };
  } catch (error) {
    return { channel: "sms", target: normalizedTo, ok: false, error: error instanceof Error ? error.message : "Error enviando SMS" };
  }
}

export async function sendBookingConfirmation(booking: BookingNotification) {
  const subject = `Confirmación de cita - ${BUSINESS_NAME}`;
  const clientText = buildTextMessage(booking, "cliente");
  const barberText = buildTextMessage(booking, "barbero");
  const results: NotificationResult[] = [];

  results.push(await sendSms(booking.telefono, clientText));

  if (booking.correo) {
    results.push(await sendEmail(booking.correo, subject, clientText, buildEmailHtml(booking, "cliente")));
  }

  if (process.env.BARBER_PHONE) {
    results.push(await sendSms(process.env.BARBER_PHONE, barberText));
  }

  if (process.env.BARBER_EMAIL) {
    results.push(await sendEmail(process.env.BARBER_EMAIL, `Nueva cita - ${BUSINESS_NAME}`, barberText, buildEmailHtml(booking, "barbero")));
  }

  const failures = results.filter((result) => !result.ok && !result.skipped);
  if (failures.length > 0) {
    console.error("Algunas notificaciones no se pudieron enviar", failures);
  }

  return results;
}

