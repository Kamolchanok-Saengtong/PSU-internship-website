"use client";

import { useEffect, useSyncExternalStore } from "react";
import { api } from "./api";
import type { MeResponse, Reminder } from "./reminders";

/**
 * The signed-in student's saved places, reminders and account email,
 * loaded from the API (/api/me) and kept in one shared cache.
 * Changes show at once and are then saved to the server.
 */
type State = { studentId: string; me: MeResponse | null; error: string | null };

const listeners = new Set<() => void>();
let state: State | null = null;
const NONE: string[] = [];
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

async function load(studentId: string) {
  state = { studentId, me: null, error: null };
  emit();
  try {
    let me = await api<MeResponse>("/api/me");
    // One-time move of saves made before the server existed.
    const legacyKey = `psu-saved:${studentId}`;
    const legacy = JSON.parse(window.localStorage.getItem(legacyKey) ?? "[]") as string[];
    if (legacy.length) {
      const { saved } = await api<{ saved: string[] }>("/api/me/saved", { method: "POST", body: { ids: legacy } });
      me = { ...me, saved };
      window.localStorage.removeItem(legacyKey);
    }
    if (state?.studentId === studentId) state = { studentId, me, error: null };
  } catch (e) {
    if (state?.studentId === studentId) state = { studentId, me: null, error: e instanceof Error ? e.message : "Could not load." };
  }
  emit();
}

function set(change: (me: MeResponse) => MeResponse) {
  if (!state?.me) return;
  state = { ...state, me: change(state.me) };
  emit();
}

/** Load (once) and return the student's data. undefined while loading. */
export function useMe(studentId: string | undefined): { me: MeResponse | null; error: string | null } {
  const snap = useSyncExternalStore(subscribe, () => state, () => null);
  useEffect(() => {
    if (studentId && state?.studentId !== studentId) void load(studentId);
  }, [studentId]);
  if (!studentId || snap?.studentId !== studentId) return { me: null, error: null };
  return { me: snap.me, error: snap.error };
}

export function useSaved(studentId: string | undefined): string[] {
  return useMe(studentId).me?.saved ?? NONE;
}

let loading: Promise<void> | null = null;

export async function toggleSaved(studentId: string, placeId: string) {
  // Clicked before the student's data arrived: wait for it first.
  if (state?.studentId !== studentId || !state.me) {
    loading ??= load(studentId).finally(() => (loading = null));
    await loading;
  }
  if (state?.studentId !== studentId || !state.me) return;
  const before = state.me;
  const saving = !before.saved.includes(placeId);
  set((me) => ({
    ...me,
    saved: saving ? [placeId, ...me.saved] : me.saved.filter((x) => x !== placeId),
    reminders: saving ? me.reminders : Object.fromEntries(Object.entries(me.reminders).filter(([k]) => k !== placeId)),
  }));
  try {
    await api("/api/me/saved", { method: "PUT", body: { placeId, saved: saving } });
  } catch {
    set(() => before); // put it back if the server said no
  }
}

/** Save a reminder setting. Throws with the server's message if it is not valid. */
export async function saveReminder(placeId: string, r: Omit<Reminder, "sent">) {
  const { reminder } = await api<{ reminder: Reminder }>(`/api/me/reminders/${encodeURIComponent(placeId)}`, {
    method: "PUT",
    body: r,
  });
  set((me) => ({ ...me, reminders: { ...me.reminders, [placeId]: reminder } }));
  return reminder;
}

export async function saveAccountEmail(email: string) {
  const me = await api<MeResponse>("/api/me", { method: "PATCH", body: { email } });
  set(() => me);
  return me;
}

/** Document checklist progress saved on the place page (see DocumentsChecklist). */
export function readDocProgress(placeId: string): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(`psu-docs:${placeId}`) ?? "[]");
  } catch {
    return [];
  }
}
