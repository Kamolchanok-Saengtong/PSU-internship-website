"use client";

import { getSession } from "./auth";

/**
 * Call our API as the signed-in student.
 * DRAFT: identity goes in the x-student-id header (see src/server/session.ts).
 * With real sign-in, the session cookie is sent automatically and this header goes away.
 */
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const session = getSession("student");
  const res = await fetch(path, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(session ? { "x-student-id": session.id } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}
