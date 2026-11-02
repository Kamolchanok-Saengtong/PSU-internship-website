"use client";

import { useSyncExternalStore } from "react";

const MAX = 3;
const listeners = new Set<() => void>();
let selected: string[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export function toggleCompare(id: string) {
  if (selected.includes(id)) {
    selected = selected.filter((s) => s !== id);
  } else if (selected.length < MAX) {
    selected = [...selected, id];
  }
  notify();
}

export function clearCompare() {
  selected = [];
  notify();
}

export function isCompared(id: string): boolean {
  return selected.includes(id);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const NONE: string[] = [];

export function useCompareIds(): string[] {
  // The server snapshot must be the same array every time, or React re-renders forever.
  return useSyncExternalStore(subscribe, () => selected, () => NONE);
}
