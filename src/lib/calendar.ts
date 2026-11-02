import { placeLocation } from "./placement";
import type { Place } from "./types";

/** Format an ISO date string (YYYY-MM-DD) as a Google Calendar all-day date (YYYYMMDD). */
function gcalDate(iso: string): string {
  return iso.replace(/-/g, "");
}

/** Return the day after an ISO date in YYYYMMDD format (Google uses exclusive end). */
function gcalNextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** Generate a Google Calendar event URL for an internship deadline. */
export function googleCalendarUrl(place: Place): string {
  const title = `Application deadline: ${place.role} at ${place.company}`;
  const details = [
    `Internship at ${place.company}`,
    `Role: ${place.role}`,
    `Where: ${placeLocation(place)}`,
    `Type: ${place.placementType}`,
    "",
    `Apply: ${place.howToApply}`,
  ].join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${gcalDate(place.closes)}/${gcalNextDay(place.closes)}`,
    details,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Generate an .ics file content string for downloading. */
export function icsContent(place: Place): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const uid = `${place.id}-${gcalDate(place.closes)}@psu-internship`;
  const summary = `Application deadline: ${place.role} at ${place.company}`;
  const description = [
    `Internship at ${place.company}`,
    `Role: ${place.role}`,
    `Where: ${placeLocation(place)}`,
    `Type: ${place.placementType}`,
    "",
    `Apply: ${place.howToApply}`,
  ]
    .join("\\n")
    .replace(/,/g, "\\,");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PSU Phuket Internship Board//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${gcalDate(place.closes)}`,
    `DTEND;VALUE=DATE:${gcalNextDay(place.closes)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
