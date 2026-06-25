import { availableTimeSlots } from "./pricing";

export function isValidTimeSlot(time: string) {
  return availableTimeSlots.includes(time as (typeof availableTimeSlots)[number]);
}

export function isValidDateString(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}
