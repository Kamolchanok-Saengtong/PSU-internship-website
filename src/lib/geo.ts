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
