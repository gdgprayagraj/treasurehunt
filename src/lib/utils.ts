import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// The event runs in India — every timestamp is shown and entered in IST,
// regardless of the server's or the viewer's own timezone. IST is a fixed
// +05:30 offset (no daylight saving), which keeps the math simple.
const IST_TIME_ZONE = "Asia/Kolkata";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Format a Date (or ISO string) for compact display in IST. Returns "—" for null. */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return (
    d.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: IST_TIME_ZONE,
    }) + " IST"
  );
}

/** Format a Date for a datetime-local input value in IST (no seconds). */
export function toDateTimeLocalValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  // Shift the instant by the fixed IST offset, then read UTC parts so the
  // wall-clock components reflect IST no matter where this runs.
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(
    ist.getUTCDate(),
  )}T${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`;
}

/**
 * Parse a `datetime-local` string (e.g. "2026-07-26T15:30"), interpreting its
 * wall-clock time as IST, into a UTC Date. Returns null for empty/invalid input.
 */
export function parseIstDateTimeLocal(value: string | null | undefined): Date | null {
  if (!value) return null;
  const withSeconds = /\d{2}:\d{2}:\d{2}$/.test(value) ? value : `${value}:00`;
  const d = new Date(`${withSeconds}+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}
