"use client";

import { useSyncExternalStore } from "react";

/**
 * DRAFT sign-in for staff and students. There is no backend yet: any ID and
 * password "signs in", and each session lives in this browser.
 *
 * To add real authentication later (e.g. PSU Passport / SSO, NextAuth, Supabase),
 * replace the functions in this file. Pages only use what is exported here.
 */
export type Role = "staff" | "student";
export type Session = { role: Role; id: string; name: string; method: "password" | "passport" };
/** Kept for the staff pages. */
export type StaffSession = Session;

const KEYS: Record<Role, string> = { staff: "psu-staff-session", student: "psu-student-session" };
const listeners = new Set<() => void>();
const cache: Partial<Record<Role, Session | null>> = {};

/** Staff sessions end with the tab; student sessions stay until they sign out. */
const storage = (role: Role) => (role === "staff" ? window.sessionStorage : window.localStorage);

function read(role: Role): Session | null {
  if (role in cache) return cache[role] ?? null;
  try {
    const raw = storage(role).getItem(KEYS[role]);
    cache[role] = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    cache[role] = null;
  }
  return cache[role] ?? null;
}

function write(role: Role, next: Session | null) {
  cache[role] = next;
  try {
    if (next) storage(role).setItem(KEYS[role], JSON.stringify(next));
    else storage(role).removeItem(KEYS[role]);
  } catch {
    // Storage blocked: the session lasts until the page reloads.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms)); // feels like a real request

/** undefined while loading (server render), null when signed out. */
export function useSession(role: Role = "staff"): Session | null | undefined {
  return useSyncExternalStore(subscribe, () => read(role), () => undefined);
}

/** Draft: accepts any non-empty ID and password. */
export async function signIn(id: string, password: string, role: Role = "staff"): Promise<Session> {
  if (!id.trim() || !password) {
    throw new Error(role === "student" ? "Enter your student ID and password." : "Enter your username and password.");
  }
  await pause(600);
  const session: Session = { role, id: id.trim(), name: id.trim(), method: "password" };
  write(role, session);
  return session;
}

/** Draft: stands in for the PSU Passport (university single sign-on) redirect. */
export async function signInWithPassport(role: Role = "staff"): Promise<Session> {
  await pause(700);
  const session: Session =
    role === "student"
      ? { role, id: "6510110000", name: "PSU student", method: "passport" }
      : { role, id: "staff", name: "PSU staff", method: "passport" };
  write(role, session);
  return session;
}

export function signOut(role: Role = "staff") {
  write(role, null);
}
