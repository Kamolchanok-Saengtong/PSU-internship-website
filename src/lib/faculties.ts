import { FACULTIES, type Faculty } from "./types";

/**
 * Official PSU faculty brand lockups, sourced from Wikimedia Commons:
 * "Faculty of Hospitality and Tourism, PSU Brand Logo.svg",
 * "Faculty of International Studies, PSU Brand Logo.svg",
 * "Faculty of Technology and Environment, PSU Brand Logo.svg",
 * "PSU CoC ENG.png" (resized to 900px wide).
 */
export const FACULTY_INFO: Record<
  Faculty,
  { code: string; slug: string; short: string; logo: string; width: number; height: number }
> = {
  "Hospitality and Tourism": { code: "FHT", slug: "fht", short: "Hospitality & Tourism", logo: "/faculties/fht.svg", width: 295, height: 50 },
  "International Studies": { code: "FIS", slug: "fis", short: "International Studies", logo: "/faculties/fis.svg", width: 205, height: 50 },
  "College of Computing": { code: "CoC", slug: "coc", short: "Computing", logo: "/faculties/coc.png", width: 900, height: 241 },
  "Technology and Environment": { code: "TE", slug: "te", short: "Tech & Environment", logo: "/faculties/te.svg", width: 281, height: 50 },
};

export function facultyFromSlug(slug: string | undefined): Faculty | undefined {
  return FACULTIES.find((f) => FACULTY_INFO[f].slug === slug);
}
