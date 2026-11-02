import type { Province } from "./types";

/** Approximate centre of where each province's places are (e.g. Hat Yai for Songkhla). */
export const PROVINCE_COORDS: Record<Province, [number, number]> = {
  Phuket: [7.89, 98.37],
  Bangkok: [13.7563, 100.5018],
  "Samut Prakan": [13.69, 100.75],
  "Chiang Mai": [18.7883, 98.9853],
  Songkhla: [7.0084, 100.4747],
  Krabi: [8.0863, 98.9063],
  "Phang Nga": [8.64, 98.25],
  "Surat Thani": [9.512, 100.0136],
  Chonburi: [13.17, 100.93],
  "Khon Kaen": [16.4419, 102.836],
};

/** PSU Phuket Campus, Vichitsongkram Rd, Kathu (approximate). */
export const CAMPUS: [number, number] = [7.8935, 98.3527];

/** Approximate centre of each district or town used in the listings. */
export const AREA_COORDS: Record<string, [number, number]> = {
  Kathu: [7.9126, 98.333],
  "Phuket Town": [7.8804, 98.3923],
  Chalong: [7.8442, 98.3378],
  Thalang: [8.031, 98.336],
  Patong: [7.8961, 98.2966],
  "Karon & Kata": [7.833, 98.297],
  "Suvarnabhumi Airport": [13.69, 100.7501],
  Sriracha: [13.1737, 100.9311],
  Sathorn: [13.7206, 100.5294],
  "Pathum Wan": [13.7449, 100.5296],
  "Bang Rak": [13.73, 100.524],
  Nimmanhaemin: [18.7984, 98.9678],
  "Mae Rim": [18.9142, 98.9446],
  "Mueang Khon Kaen": [16.4419, 102.836],
  "Koh Samui": [9.535, 100.0],
  "Khao Lak": [8.6367, 98.2487],
  "Hat Yai": [7.0084, 100.4747],
  "Ao Nang": [8.0322, 98.8226],
};

/** A small, stable offset per place so pins in the same district don't sit on top of each other. */
function jitter(id: string): [number, number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const a = ((h >>> 0) % 360) * (Math.PI / 180);
  const r = 0.004 + (((h >>> 8) % 100) / 100) * 0.006; // about 400–1,000 m
  return [Math.sin(a) * r, Math.cos(a) * r];
}

/** Where to pin a place, or null for remote work. */
export function placeCoords(p: { id: string; area: string; province: keyof typeof PROVINCE_COORDS }): [number, number] | null {
  if (p.area === "Remote") return null;
  const base = AREA_COORDS[p.area] ?? PROVINCE_COORDS[p.province];
  const [dy, dx] = jitter(p.id);
  return [base[0] + dy, base[1] + dx];
}

/** Straight-line distance in km. */
export function distanceKm(a: [number, number], b: [number, number]): number {
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad;
  const dLng = (b[1] - a[1]) * rad;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(s));
}

export const VIEWS = {
  Phuket: { center: [7.92, 98.34] as [number, number], zoom: 11 },
  Bangkok: { center: [13.72, 100.62] as [number, number], zoom: 10 },
  "Chiang Mai": { center: [18.85, 98.96] as [number, number], zoom: 11 },
} as const;
