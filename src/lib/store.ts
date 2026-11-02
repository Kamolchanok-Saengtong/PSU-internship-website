"use client";

import { useSyncExternalStore } from "react";
import { SAMPLE_PLACES } from "./sample-data";
import type { Place } from "./types";

/**
 * Draft data layer: places live in this browser's localStorage, seeded with
 * sample data. Swap these functions for API calls once a database and staff
 * login exist; the components only use usePlaces / savePlace / deletePlace.
 */
// v3 added benefits and documents; older saved lists are ignored.
const KEY = "psu-phuket-internships:v3";
const listeners = new Set<() => void>();
let cache: Place[] | null = null;

function read(): Place[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Place[]) : SAMPLE_PLACES;
  } catch {
    cache = SAMPLE_PLACES;
  }
  return cache;
}

function write(next: Place[]) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked (private mode): changes last until the tab closes.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Returns null during server render, then the stored places. */
export function usePlaces(): Place[] | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function savePlace(place: Place) {
  const list = read();
  const exists = list.some((p) => p.id === place.id);
  write(exists ? list.map((p) => (p.id === place.id ? place : p)) : [place, ...list]);
}

export function deletePlace(id: string) {
  write(read().filter((p) => p.id !== id));
}

export function resetToSample() {
  write(SAMPLE_PLACES);
}
