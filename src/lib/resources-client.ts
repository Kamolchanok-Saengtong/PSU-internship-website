"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getSession } from "./auth";
import type { Resource } from "./resources";

/** What the browser gets back: the file without its storage name. */
export type PublicResource = Omit<Resource, "file"> & { file?: { name: string; size: number; type: string } };

const listeners = new Set<() => void>();
let state: { list: PublicResource[] | null; error: string | null } = { list: null, error: null };
let started = false;
const emit = () => listeners.forEach((l) => l());

export async function reloadResources() {
  try {
    const res = await fetch("/api/resources", { cache: "no-store" });
    if (!res.ok) throw new Error();
    state = { list: (await res.json()).resources, error: null };
  } catch {
    state = { list: state.list, error: "Couldn't load news and documents." };
  }
  emit();
}

/** All news and documents (pinned first, newest first). null while loading. */
export function useResources() {
  const snap = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
  useEffect(() => {
    if (!started) {
      started = true;
      void reloadResources();
    }
  }, []);
  return snap;
}

export const fileUrl = (id: string) => `/api/resources/${encodeURIComponent(id)}/file`;

/**
 * Staff calls. DRAFT: identity goes in x-staff-id (see src/server/session.ts);
 * real sign-in will send a session cookie instead.
 */
async function staffSend(path: string, method: string, body?: FormData) {
  const staff = getSession("staff");
  const res = await fetch(path, { method, body, headers: staff ? { "x-staff-id": staff.id } : {} });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  await reloadResources();
  return data;
}

export const createResource = (form: FormData) => staffSend("/api/resources", "POST", form);
export const updateResource = (id: string, form: FormData) => staffSend(`/api/resources/${encodeURIComponent(id)}`, "PATCH", form);
export const deleteResource = (id: string) => staffSend(`/api/resources/${encodeURIComponent(id)}`, "DELETE");
