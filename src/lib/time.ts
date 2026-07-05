import { availableTimeSlots } from "./pricing";

export function isValidTimeSlot(time: string) {
  return availableTimeSlots.includes(time as (typeof availableTimeSlots)[number]);
}

export function isValidDateString(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function getLocalDateString(timeZone = "America/Bogota") {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}
