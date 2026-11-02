"use client";

import { useSyncExternalStore } from "react";

/** Co-op application statuses, as used by the PSU co-op system. */
export const APP_STATUSES = ["choosing", "approving", "rechoosing", "printing", "waiting", "repair", "accept", "cancel"] as const;
export type AppStatus = (typeof APP_STATUSES)[number];

export const STATUS_INFO: Record<
  AppStatus,
  { label: string; th: string; en: string; next: string; action?: "choose"; tone: string; dot: string }
> = {
  choosing: {
    label: "Choosing",
    th: "นักศึกษากรอกข้อมูลส่วนตัว และเลือกสถานประกอบการ",
    en: "Fill in your details and choose a place.",
    next: "Fill in your details and choose the place you want to apply to.",
    action: "choose",
    tone: "bg-[#e3f2fb] text-[#17608a]",
    dot: "bg-[#3b9bd0]",
  },
  approving: {
    label: "Approving",
    th: "รออาจารย์พิจารณาอนุมัติ",
    en: "Waiting for your advisor to approve.",
    next: "Your advisor is reviewing your choice. You don't need to do anything yet.",
    tone: "bg-[#f1f6d6] text-[#58660f]",
    dot: "bg-[#a6b82a]",
  },
  rechoosing: {
    label: "Rechoosing",
    th: "อาจารย์ปฏิเสธ ให้เลือกสถานประกอบการใหม่",
    en: "Your advisor declined. Choose a new place.",
    next: "Your advisor asked you to choose a different place. Pick a new one before the deadline.",
    action: "choose",
    tone: "bg-[#f1e8fb] text-[#6b2fa8]",
    dot: "bg-[#8f45d6]",
  },
  printing: {
    label: "Printing",
    th: "กำลังดำเนินงานจัดการเรื่องเอกสาร",
    en: "The co-op office is preparing your documents.",
    next: "The co-op office is preparing your request letter. It will be sent to the company soon.",
    tone: "bg-[#fbe8f8] text-[#a3238f]",
    dot: "bg-[#e05bcf]",
  },
  waiting: {
    label: "Waiting",
    th: "รอสถานประกอบการตอบรับ",
    en: "Waiting for the company to reply.",
    next: "Your request letter has been sent. Waiting for the company to reply.",
    tone: "bg-[#fdf0db] text-[#8a5a0b]",
    dot: "bg-[#e3a23b]",
  },
  repair: {
    label: "Repair",
    th: "สถานประกอบการปฏิเสธ ให้เลือกสถานประกอบการใหม่",
    en: "The company declined. Choose a new place.",
    next: "The company could not take you this time. Choose a new place before the deadline.",
    action: "choose",
    tone: "bg-[#f7e9dc] text-[#8a4a17]",
    dot: "bg-[#b5652a]",
  },
  accept: {
    label: "Accept",
    th: "สถานประกอบการตอบรับแล้ว",
    en: "The company accepted you.",
    next: "Congratulations! The company accepted you. Get ready for your co-op semester.",
    tone: "bg-[#e3f4ec] text-success",
    dot: "bg-[#3f9f61]",
  },
  cancel: {
    label: "Cancel",
    th: "ยกเลิก",
    en: "Cancelled.",
    next: "This application was cancelled. Contact the co-op office if this is a mistake.",
    tone: "bg-[#eceef3] text-[#5f6678]",
    dot: "bg-[#7a8296]",
  },
};

/** The main path. Rechoosing loops back from Approving, Repair from Waiting. */
export const JOURNEY: AppStatus[] = ["choosing", "approving", "printing", "waiting", "accept"];
export const DETOUR: Partial<Record<AppStatus, AppStatus>> = { rechoosing: "approving", repair: "waiting" };

export type Period = { label: string; from: string; to: string };
export type HistoryEntry = { status: AppStatus; at: string; note: string };

export type Application = {
  code: string;
  number: number;
  program: "Co-op";
  created: string;
  status: AppStatus;
  faculty: string;
  major: string;
  placeId: string;
  history: HistoryEntry[];
  schedule: Period[];
  language: { skill: string; level: string }[];
  activities: string[];
};

const HISTORY: HistoryEntry[] = [
  { status: "choosing", at: "2026-09-01T13:21:02", note: "Application started" },
  { status: "approving", at: "2026-09-05T10:02:00", note: "Place chosen, sent to advisor" },
  { status: "printing", at: "2026-09-12T09:40:00", note: "Advisor approved" },
  { status: "waiting", at: "2026-09-18T15:10:00", note: "Request letter sent to the company" },
  { status: "repair", at: "2026-10-28T11:25:00", note: "The company could not take a student this term" },
];

/**
 * DRAFT sample application, the same for every student until the backend
 * exists. The status can be switched on /me to preview each one.
 */
export function sampleApplication(status: AppStatus): Application {
  const order: AppStatus[] = ["choosing", "approving", "printing", "waiting"];
  let history: HistoryEntry[];
  if (status === "rechoosing") history = [...HISTORY.slice(0, 2), { status, at: "2026-09-09T14:00:00", note: "Advisor asked for a different place" }];
  else if (status === "repair") history = HISTORY;
  else if (status === "accept") history = [...HISTORY.slice(0, 4), { status, at: "2026-10-28T11:25:00", note: "The company accepted you" }];
  else if (status === "cancel") history = [...HISTORY.slice(0, 2), { status, at: "2026-09-20T09:00:00", note: "Cancelled at the student's request" }];
  else history = HISTORY.slice(0, order.indexOf(status) + 1);

  return {
    code: "COOP0103",
    number: 2652,
    program: "Co-op",
    created: "2026-09-01T13:21:02",
    status,
    faculty: "College of Computing",
    major: "Digital Engineering (International Program)",
    placeId: "krungthep-fintech-software-coop",
    history,
    schedule: [
      { label: "Request", from: "2026-08-11", to: "2026-09-02" },
      { label: "Choosing", from: "2026-09-03", to: "2026-11-20" },
      { label: "Rechoosing / Repair", from: "2026-09-03", to: "2026-11-20" },
    ],
    language: [
      { skill: "Listening", level: "Good" },
      { skill: "Speaking", level: "Good" },
      { skill: "Reading", level: "Good" },
    ],
    activities: ["Programming club member", "University hackathon, 2025"],
  };
}

/* Preview status switch (draft only), saved in this browser. */
const KEY = "psu-demo-app-status";
const listeners = new Set<() => void>();
let cache: AppStatus | null = null;

function read(): AppStatus {
  if (cache) return cache;
  try {
    const v = window.localStorage.getItem(KEY) as AppStatus | null;
    cache = v && APP_STATUSES.includes(v) ? v : "repair";
  } catch {
    cache = "repair";
  }
  return cache;
}

export function setPreviewStatus(s: AppStatus) {
  cache = s;
  try {
    window.localStorage.setItem(KEY, s);
  } catch {
    // Storage blocked: lasts until reload.
  }
  listeners.forEach((l) => l());
}

export function usePreviewStatus(): AppStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => "repair",
  );
}
