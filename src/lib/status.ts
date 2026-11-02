import type { Place } from "./types";

export type Status = "final-call" | "closing-soon" | "open" | "closed";

const DAY = 86_400_000;

/** Whole days from today until the deadline (end of that day, local time). */
export function daysLeft(closes: string, now = new Date()): number {
  const end = new Date(`${closes}T23:59:59`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((end.getTime() - today.getTime()) / DAY);
}

export function statusOf(place: Place, now = new Date()): Status {
  const d = daysLeft(place.closes, now);
  if (d < 0) return "closed";
  if (d <= 3) return "final-call";
  if (d <= 14) return "closing-soon";
  return "open";
}

export const STATUS_LABEL: Record<Status, string> = {
  "final-call": "Final call",
  "closing-soon": "Closing soon",
  open: "Open",
  closed: "Closed",
};

export function countdown(closes: string, now = new Date()): string {
  const d = daysLeft(closes, now);
  if (d < 0) return "Applications closed";
  if (d === 0) return "Closes today";
  if (d === 1) return "Closes tomorrow";
  return `${d} days left`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const longFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const shortDate = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d} ${MONTHS[Number(m) - 1]}`;
};
export const longDate = (iso: string) => longFmt.format(new Date(`${iso}T00:00:00`));

export const allowanceText = (thb: number, per: "month" | "hour" = "month") =>
  thb > 0 ? `฿${thb.toLocaleString("en-US")}/${per === "hour" ? "hr" : "mo"}` : "Unpaid";
