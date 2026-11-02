import type { PlacementType, Place } from "./types";

export const TYPE_INFO: Record<
  PlacementType,
  { slug: string; label: string; short: string; length: string; text: string }
> = {
  "Part-time": {
    slug: "part-time",
    label: "Part-time jobs",
    short: "Part-time",
    length: "Alongside classes",
    text: "Paid hours in the evenings or at weekends, while you keep studying.",
  },
  "Short-term internship": {
    slug: "short-term",
    label: "Short-term internships",
    short: "Short-term",
    length: "A few weeks to 3 months",
    text: "Real work experience over a break, usually the summer semester.",
  },
  "Co-op": {
    slug: "co-op",
    label: "Co-op placements",
    short: "Co-op",
    length: "One full semester",
    text: "Cooperative education (สหกิจศึกษา): about 16 weeks full-time, taken as your faculty's co-op course.",
  },
};

export function typeFromSlug(slug: string | undefined): PlacementType | undefined {
  return (Object.keys(TYPE_INFO) as PlacementType[]).find((t) => TYPE_INFO[t].slug === slug);
}

/** Rough monthly pay, so hourly part-time work can be sorted alongside monthly allowances. */
export function monthlyPay(p: Place): number {
  return p.payPer === "hour" ? p.allowance * (p.hoursPerWeek ?? 10) * 4 : p.allowance;
}

/** "16 weeks", "3 weeks" or "4 months" from the placement dates. */
export function durationText(starts: string, ends: string): string {
  const days = Math.round((Date.parse(ends) - Date.parse(starts)) / 86_400_000) + 1;
  const weeks = Math.round(days / 7);
  return weeks <= 20 ? `${weeks} ${weeks === 1 ? "week" : "weeks"}` : `${Math.round(days / 30)} months`;
}

export const placeLocation = (p: Place) => (p.area && p.area !== p.province ? `${p.area}, ${p.province}` : p.province);
