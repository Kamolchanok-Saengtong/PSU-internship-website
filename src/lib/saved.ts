"use client";

import { useSyncExternalStore } from "react";

/**
 * DRAFT saved places for a signed-in student, kept in this browser per student ID.
 * Move this to the student's account in the database when the backend exists.
 */
const listeners = new Set<() => void>();
const cache = new Map<string, string[]>();
const key = (studentId: string) => `psu-saved:${studentId}`;
const NONE: string[] = [];

function read(studentId: string): string[] {
  if (cache.has(studentId)) return cache.get(studentId)!;
  let ids: string[] = [];
  try {
    ids = JSON.parse(window.localStorage.getItem(key(studentId)) ?? "[]");
  } catch {
    ids = [];
  }
  cache.set(studentId, ids);
  return ids;
}

export function toggleSaved(studentId: string, placeId: string) {
  const ids = read(studentId);
  const next = ids.includes(placeId) ? ids.filter((x) => x !== placeId) : [placeId, ...ids];
  cache.set(studentId, next);
  try {
    window.localStorage.setItem(key(studentId), JSON.stringify(next));
  } catch {
    // Storage blocked: saved places last until the tab closes.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSaved(studentId: string | undefined): string[] {
  return useSyncExternalStore(
    subscribe,
    () => (studentId ? read(studentId) : NONE),
    () => NONE,
  );
}

/** Document checklist progress saved on the place page (see DocumentsChecklist). */
export function readDocProgress(placeId: string): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(`psu-docs:${placeId}`) ?? "[]");
  } catch {
    return [];
  }
}
