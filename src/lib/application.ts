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
    next: "Your advisor is reviewing your request and documents. You don't need to do anything yet.",
    tone: "bg-[#f1f6d6] text-[#58660f]",
    dot: "bg-[#a6b82a]",
  },
  rechoosing: {
    label: "Rechoosing",
    th: "อาจารย์ปฏิเสธ ให้เลือกสถานประกอบการใหม่",
    en: "Your advisor declined. Choose a new place.",
    next: "Your advisor asked you to choose a different place. Pick a new one and send it again before the deadline.",
    action: "choose",
    tone: "bg-[#f1e8fb] text-[#6b2fa8]",
    dot: "bg-[#8f45d6]",
  },
  printing: {
    label: "Printing",
    th: "กำลังดำเนินงานจัดการเรื่องเอกสาร",
    en: "The co-op office is preparing your documents.",
    next: "Your advisor approved. The co-op office is preparing your request letter for the company.",
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
    next: "The company could not take you this time. Choose a new place and send it again before the deadline.",
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
    next: "This application was cancelled. You can start a new one while the choosing period is open.",
    action: "choose",
    tone: "bg-[#eceef3] text-[#5f6678]",
    dot: "bg-[#7a8296]",
  },
};

/** The main path. Rechoosing loops back from Approving, Repair from Waiting. */
export const JOURNEY: AppStatus[] = ["choosing", "approving", "printing", "waiting", "accept"];
export const DETOUR: Partial<Record<AppStatus, AppStatus>> = { rechoosing: "approving", repair: "waiting" };

/** A student may send a (new) request only from these statuses. */
export const CAN_APPLY: AppStatus[] = ["choosing", "rechoosing", "repair", "cancel"];

export type Period = { label: string; from: string; to: string };
export const SCHEDULE: Period[] = [
  { label: "Request", from: "2026-08-11", to: "2026-09-02" },
  { label: "Choosing", from: "2026-09-03", to: "2026-11-20" },
  { label: "Rechoosing / Repair", from: "2026-09-03", to: "2026-11-20" },
];

export const LEVELS = ["Basic", "Fair", "Good", "Very good", "Fluent"] as const;
export const SKILLS = ["Listening", "Speaking", "Reading", "Writing"] as const;

export type HistoryEntry = { status: AppStatus; at: string; note: string; by: "student" | "advisor" | "office" };
export type AppDocument = { name: string; file: string; size: number };

export type StudentDetails = {
  name: string;
  faculty: string;
  major: string;
  year: string;
  gpa: string;
  phone: string;
  email: string;
};

export type Application = StudentDetails & {
  number: number;
  code: string;
  studentId: string;
  created: string;
  updated: string;
  status: AppStatus;
  placeId: string;
  language: { skill: string; level: string }[];
  activities: string[];
  motivation: string;
  documents: AppDocument[];
  history: HistoryEntry[];
};

/* ---------- Draft store: every application, kept in this browser ---------- */

const KEY = "psu-coop-applications";
const listeners = new Set<() => void>();
let cache: Application[] | null = null;
const NONE: Application[] = [];

function read(): Application[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache!;
}

function write(next: Application[]) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: changes last until the tab closes.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useApplications(): Application[] {
  return useSyncExternalStore(subscribe, read, () => NONE);
}

/** The student's latest application, or undefined. */
export function useMyApplication(studentId: string | undefined): Application | undefined {
  const all = useApplications();
  return studentId ? all.find((a) => a.studentId === studentId) : undefined;
}

const now = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

function update(number: number, change: (a: Application) => Application) {
  write(read().map((a) => (a.number === number ? { ...change(a), updated: now() } : a)));
}

function move(a: Application, status: AppStatus, note: string, by: HistoryEntry["by"]): Application {
  return { ...a, status, history: [...a.history, { status, at: now(), note, by }] };
}

export type SubmitInput = StudentDetails & {
  studentId: string;
  placeId: string;
  placeName: string;
  language: Application["language"];
  activities: string[];
  motivation: string;
  documents: AppDocument[];
};

/** Send a request to the advisor: a new application, or a new place on an existing one. */
export function submitApplication(input: SubmitInput): Application {
  const { placeName, ...data } = input;
  const all = read();
  const existing = all.find((a) => a.studentId === input.studentId);
  if (existing && CAN_APPLY.includes(existing.status) && existing.status !== "cancel") {
    const next = move({ ...existing, ...data }, "approving", `Sent to advisor: ${placeName}`, "student");
    write(all.map((a) => (a.number === existing.number ? { ...next, updated: now() } : a)));
    return next;
  }
  const number = Math.max(2651, ...all.map((a) => a.number)) + 1;
  const t = now();
  const app: Application = {
    ...data,
    number,
    code: `COOP${String(number).slice(-4)}`,
    created: t,
    updated: t,
    status: "approving",
    history: [
      { status: "choosing", at: t, note: "Application started", by: "student" },
      { status: "approving", at: t, note: `Sent to advisor: ${placeName}`, by: "student" },
    ],
  };
  write([app, ...all.filter((a) => a.studentId !== input.studentId)]);
  return app;
}

export const advisorApprove = (n: number) => update(n, (a) => move(a, "printing", "Advisor approved", "advisor"));
export const advisorDecline = (n: number, reason: string) =>
  update(n, (a) => move(a, "rechoosing", `Advisor declined${reason ? `: ${reason}` : ""}`, "advisor"));
export const markLetterSent = (n: number, company: string) =>
  update(n, (a) => move(a, "waiting", `Request letter sent to ${company}`, "office"));
export const companyAccepted = (n: number) => update(n, (a) => move(a, "accept", "The company accepted the student", "office"));
export const companyDeclined = (n: number, reason: string) =>
  update(n, (a) => move(a, "repair", `The company declined${reason ? `: ${reason}` : ""}`, "office"));
export const cancelApplication = (n: number) => update(n, (a) => move(a, "cancel", "Cancelled by the student", "student"));
