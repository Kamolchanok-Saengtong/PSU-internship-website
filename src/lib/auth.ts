"use client";

import { useSyncExternalStore } from "react";

/**
 * DRAFT staff session. There is no backend yet: any username and password
 * "signs in", and the session lives in this browser tab (sessionStorage).
 *
 * To add real authentication later (e.g. PSU Passport / SSO, NextAuth, Supabase),
 * replace signIn / signInWithPassport / signOut and useSession here. The login
 * page and the staff page only use these four functions.
 */
export type StaffSession = { name: string; method: "password" | "passport" };

const KEY = "psu-staff-session";
const listeners = new Set<() => void>();
let cache: StaffSession | null | undefined;

function read(): StaffSession | null {
  if (cache !== undefined) return cache;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as StaffSession) : null;
  } catch {
    cache = null;
  }
  return cache;
}

function write(next: StaffSession | null) {
  cache = next;
  try {
    if (next) window.sessionStorage.setItem(KEY, JSON.stringify(next));
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the session lasts until the page reloads.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** undefined while loading (server render), null when signed out. */
export function useSession(): StaffSession | null | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined);
}

/** Draft: accepts any non-empty username and password. */
export async function signIn(username: string, password: string): Promise<StaffSession> {
  if (!username.trim() || !password) throw new Error("Enter your username and password.");
  await new Promise((r) => setTimeout(r, 600)); // feels like a real request
  const session: StaffSession = { name: username.trim(), method: "password" };
  write(session);
  return session;
}

/** Draft: stands in for the PSU Passport (university single sign-on) redirect. */
export async function signInWithPassport(): Promise<StaffSession> {
  await new Promise((r) => setTimeout(r, 700));
  const session: StaffSession = { name: "PSU staff", method: "passport" };
  write(session);
  return session;
}

export function signOut() {
  write(null);
}
