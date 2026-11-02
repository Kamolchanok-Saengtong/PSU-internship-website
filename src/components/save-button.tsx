"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useSession } from "@/lib/auth";
import { toggleSaved, useSaved } from "@/lib/saved";

/**
 * Save a place to the student's list. Signed-out visitors are sent to sign in
 * and brought back here afterwards.
 */
export function SaveButton({ placeId, compact = false }: { placeId: string; compact?: boolean }) {
  const session = useSession("student");
  const saved = useSaved(session?.id);
  const on = saved.includes(placeId);

  if (!session) {
    const href = `/signin?next=${encodeURIComponent(`/places/${placeId}`)}`;
    return compact ? (
      <Link
        href={href}
        title="Sign in to save"
        className="relative z-10 grid size-9 place-items-center rounded-lg text-muted hover:bg-navy-50 hover:text-navy"
      >
        <Bookmark className="size-[18px]" aria-hidden />
        <span className="sr-only">Sign in to save this place</span>
      </Link>
    ) : (
      <Link href={href} className="btn-secondary h-10 w-full text-sm">
        <Bookmark className="size-4" aria-hidden /> Sign in to save
      </Link>
    );
  }

  const label = on ? "Saved" : "Save";
  return compact ? (
    <button
      type="button"
      onClick={() => toggleSaved(session.id, placeId)}
      aria-pressed={on}
      title={on ? "Remove from saved" : "Save this place"}
      className={`relative z-10 grid size-9 place-items-center rounded-lg transition-colors ${
        on ? "bg-navy-50 text-navy" : "text-muted hover:bg-navy-50 hover:text-navy"
      }`}
    >
      {on ? <BookmarkCheck className="size-[18px]" aria-hidden /> : <Bookmark className="size-[18px]" aria-hidden />}
      <span className="sr-only">{on ? "Remove from saved" : "Save this place"}</span>
    </button>
  ) : (
    <button
      type="button"
      onClick={() => toggleSaved(session.id, placeId)}
      aria-pressed={on}
      className={`h-10 w-full text-sm ${on ? "btn-primary" : "btn-secondary"}`}
    >
      {on ? <BookmarkCheck className="size-4" aria-hidden /> : <Bookmark className="size-4" aria-hidden />} {label}
    </button>
  );
}
