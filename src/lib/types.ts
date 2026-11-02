export const FACULTIES = [
  "Hospitality and Tourism",
  "International Studies",
  "Technology and Environment",
  "College of Computing",
] as const;

export const PROVINCES = [
  "Phuket",
  "Bangkok",
  "Samut Prakan",
  "Chiang Mai",
  "Songkhla",
  "Krabi",
  "Phang Nga",
  "Surat Thani",
  "Chonburi",
  "Khon Kaen",
] as const;

export const PLACEMENT_TYPES = ["Part-time", "Short-term internship", "Co-op"] as const;

export const WORK_MODES = ["On-site", "Hybrid", "Remote"] as const;

export type Faculty = (typeof FACULTIES)[number];
export type Province = (typeof PROVINCES)[number];
export type PlacementType = (typeof PLACEMENT_TYPES)[number];
export type WorkMode = (typeof WORK_MODES)[number];
export type PayPer = "month" | "hour";

export type Place = {
  id: string;
  company: string;
  role: string;
  placementType: PlacementType;
  province: Province;
  /** District, town or neighbourhood within the province, e.g. "Kathu" or "Sathorn". */
  area: string;
  faculties: Faculty[];
  workMode: WorkMode;
  /** Pay in THB per `payPer`. 0 means unpaid. */
  allowance: number;
  payPer: PayPer;
  /** Part-time only: expected hours per week. */
  hoursPerWeek?: number;
  /** Application deadline, ISO date (YYYY-MM-DD). */
  closes: string;
  /** Placement start and end, ISO dates. */
  starts: string;
  ends: string;
  seats: number;
  summary: string;
  duties: string[];
  requirements: string[];
  /** What the student gets besides pay, e.g. meals, accommodation, a certificate. */
  benefits: string[];
  /** Documents to send when applying, e.g. CV, transcript, co-op letter. */
  documents: string[];
  howToApply: string;
  contactName: string;
  contactEmail: string;
};
