"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bookmark, FileCheck2, Loader2, LogOut } from "lucide-react";
import { signOut, useSession } from "@/lib/auth";
import { readDocProgress, useSaved } from "@/lib/saved";
import { statusOf } from "@/lib/status";
import { usePlaces } from "@/lib/store";
import { PositionRow } from "./position-row";

/** A signed-in student's page: saved places and how ready their documents are. */
export function MyPlaces() {
  const session = useSession("student");
  const router = useRouter();
  const places = usePlaces();
  const saved = useSaved(session?.id);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const leaving = useRef(false);

  // Signed out (not by pressing Sign out here): ask them to sign in.
  useEffect(() => {
    if (session === null && !leaving.current) router.replace("/signin?next=/me");
  }, [session, router]);

  // Document ticks live in the browser; read them once places are known.
  useEffect(() => {
    if (!places) return;
    const next: Record<string, number> = {};
    for (const id of saved) next[id] = readDocProgress(id).length;
    setProgress(next);
  }, [places, saved]);

  if (!session || places === null) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" aria-hidden /> Loading your page…
        </span>
      </div>
    );
  }

  const list = saved.map((id) => places.find((p) => p.id === id)).filter((p) => p !== undefined);
  const open = list.filter((p) => statusOf(p) !== "closed");
  const docsReady = list.filter((p) => (p.documents ?? []).length > 0 && (progress[p.id] ?? 0) >= p.documents.length).length;

  return (
    <>
      <section className="hero-band">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 pt-10 pb-10 sm:px-6 sm:pt-12">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-full bg-navy text-xl font-bold text-white uppercase">
              {session.name.slice(0, 1)}
            </span>
            <div>
              <h1 className="text-[clamp(1.8rem,4vw,2.4rem)] leading-tight font-bold tracking-[-0.02em] text-navy">
                My places
              </h1>
              <p className="text-body">
                {session.name}
                {session.method === "passport" && <span className="text-muted"> · {session.id}</span>}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              leaving.current = true;
              router.replace("/");
              signOut("student");
            }}
            className="btn-secondary h-10 text-sm"
          >
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ul className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Bookmark, value: list.length, label: "Saved places" },
            { icon: ArrowRight, value: open.length, label: "Still open" },
            { icon: FileCheck2, value: docsReady, label: "All documents ready" },
          ].map(({ icon: Icon, value, label }) => (
            <li key={label} className="panel flex items-center gap-4 p-4">
              <span className="grid size-11 place-items-center rounded-xl bg-navy-50 text-navy">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="tabular block text-2xl leading-none font-bold text-navy">{value}</span>
                <span className="mt-1 block text-sm text-muted">{label}</span>
              </span>
            </li>
          ))}
        </ul>

        <section aria-labelledby="saved-title" className="mt-10">
          <h2 id="saved-title" className="text-xl font-bold text-navy">
            Saved places
          </h2>
          {list.length === 0 ? (
            <div className="panel mt-4 px-6 py-14 text-center">
              <Bookmark className="mx-auto size-8 text-navy-200" aria-hidden />
              <p className="mt-3 text-lg font-semibold text-navy">No saved places yet</p>
              <p className="mt-1 text-muted">Tap the bookmark on any place to keep it here.</p>
              <Link href="/positions" className="btn-primary mt-5 text-sm">
                Browse positions <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {list.map((p) => {
                const total = (p.documents ?? []).length;
                const done = Math.min(total, progress[p.id] ?? 0);
                return (
                  <li key={p.id}>
                    <ul>
                      <PositionRow place={p} status={statusOf(p)} compact />
                    </ul>
                    {total > 0 && (
                      <Link
                        href={`/places/${p.id}`}
                        className="mx-4 -mt-1 flex items-center gap-3 rounded-b-xl border border-t-0 border-rule bg-white px-4 py-2.5 text-sm hover:bg-navy-50"
                      >
                        <FileCheck2 className={`size-4 ${done === total ? "text-success" : "text-muted"}`} aria-hidden />
                        <span className={done === total ? "font-semibold text-success" : "text-body"}>
                          {done === total ? "All documents ready" : `${done} of ${total} documents ready`}
                        </span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-100" aria-hidden>
                          <span className="block h-full rounded-full bg-success" style={{ width: `${(done / total) * 100}%` }} />
                        </span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="mt-8 text-sm text-muted">
          Draft: your saved places are kept in this browser for now. They will move to your PSU account when sign-in is
          connected.
        </p>
      </div>
    </>
  );
}
