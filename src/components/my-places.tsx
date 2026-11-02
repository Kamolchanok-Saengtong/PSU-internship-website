"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  CircleCheck,
  FileCheck2,
  GraduationCap,
  Loader2,
  LogOut,
  X,
} from "lucide-react";
import { signOut, useSession } from "@/lib/auth";
import { readDocProgress, useMe } from "@/lib/saved";
import { AccountEmail, ReminderControl } from "./reminder-control";
import { ResourcesStrip } from "./resources-strip";
import { statusOf } from "@/lib/status";
import { usePlaces } from "@/lib/store";
import { PositionRow } from "./position-row";
import {
  ApplicationPanel,
  Journey,
  Schedule,
  StatusGuide,
} from "./application-panel";
import { useMyApplication } from "@/lib/application";

const EMPTY: string[] = [];

/** A signed-in student's page: their co-op application status, and saved places. */
export function MyPlaces() {
  const session = useSession("student");
  const router = useRouter();
  const places = usePlaces();
  const { me, error: meError } = useMe(session?.id);
  const saved = me?.saved ?? EMPTY;
  const app = useMyApplication(session?.id);
  const [justSent, setJustSent] = useState(false);

  // Arrived from the request form: show a confirmation, then tidy the URL.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("sent")) {
      setJustSent(true);
      window.history.replaceState(null, "", "/me");
    }
  }, []);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const leaving = useRef(false);

  // Signed out (not by pressing Sign out here): ask them to sign in.
  useEffect(() => {
    if (session === null && !leaving.current)
      router.replace("/signin?next=/me");
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
          <Loader2 className="size-5 animate-spin" aria-hidden /> Loading your
          page…
        </span>
      </div>
    );
  }

  const list = saved
    .map((id) => places.find((p) => p.id === id))
    .filter((p) => p !== undefined);
  const open = list.filter((p) => statusOf(p) !== "closed");
  const docsReady = list.filter(
    (p) =>
      (p.documents ?? []).length > 0 &&
      (progress[p.id] ?? 0) >= p.documents.length,
  ).length;

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
                {app?.name ||
                  (session.name !== session.id ? session.name : "My page")}
              </h1>
              <dl className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <div className="flex gap-1.5">
                  <dt className="text-muted">ID</dt>
                  <dd className="tabular font-medium text-ink">{session.id}</dd>
                </div>
                {app && (
                  <>
                    <div className="flex gap-1.5">
                      <dt className="text-muted">Faculty</dt>
                      <dd className="font-medium text-ink">{app.faculty}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-muted">Major</dt>
                      <dd className="font-medium text-ink">{app.major}</dd>
                    </div>
                  </>
                )}
              </dl>
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
        {justSent && app && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-success/40 bg-[#f1faf5] px-4 py-3"
          >
            <CircleCheck
              className="mt-0.5 size-5 shrink-0 text-success"
              aria-hidden
            />
            <p className="flex-1 text-[0.95rem] text-ink">
              <strong>Request sent.</strong> Your advisor will review it. You
              can follow every step here.
            </p>
            <button
              type="button"
              onClick={() => setJustSent(false)}
              className="grid size-7 place-items-center rounded-md text-muted hover:bg-white"
            >
              <X className="size-4" aria-hidden />
              <span className="sr-only">Dismiss</span>
            </button>
          </div>
        )}
        {app ? (
          <ApplicationPanel
            app={app}
            place={places.find((p) => p.id === app.placeId)}
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
            <div className="min-w-0 space-y-5">
              <section className="panel flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-navy text-white">
                  <GraduationCap className="size-7" aria-hidden />
                </span>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-navy">
                    No co-op request yet
                  </h2>
                  <p className="mt-1 text-body">
                    Choose a co-op place, then press{" "}
                    <strong>Apply for co-op</strong> on its page. You will fill
                    in your details, attach your documents and send it to your
                    advisor.
                  </p>
                </div>
                <Link
                  href="/positions?type=co-op"
                  className="btn-primary h-11 shrink-0 text-sm"
                >
                  Browse co-op places{" "}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </section>
              <section className="panel p-5 sm:p-6">
                <h2 className="font-semibold text-navy">
                  How a co-op request works
                </h2>
                <p className="mt-1 mb-6 text-sm text-muted">
                  After you send a request, you can follow each step here. If
                  your advisor declines (Rechoosing) or the company declines
                  (Repair), you choose a new place and send it again.
                </p>
                <Journey status={null} />
              </section>
            </div>
            <aside>
              <Schedule fill />
            </aside>
          </div>
        )}
        {!app && <StatusGuide />}

        <div className="mt-5">
          <ResourcesStrip
            title="Read first"
            intro="Guides and forms to check before you send or change a co-op request."
            pinnedOnly
            limit={4}
          />
        </div>

        <h2 className="mt-14 mb-4 text-2xl font-bold text-navy">
          Saved places
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Bookmark, value: list.length, label: "Saved places" },
            { icon: ArrowRight, value: open.length, label: "Still open" },
            {
              icon: FileCheck2,
              value: docsReady,
              label: "All documents ready",
            },
          ].map(({ icon: Icon, value, label }) => (
            <li key={label} className="panel flex items-center gap-4 p-4">
              <span className="grid size-11 place-items-center rounded-xl bg-navy-50 text-navy">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="tabular block text-2xl leading-none font-bold text-navy">
                  {value}
                </span>
                <span className="mt-1 block text-sm text-muted">{label}</span>
              </span>
            </li>
          ))}
        </ul>

        <section aria-labelledby="saved-title" className="mt-10">
          <h3 id="saved-title" className="sr-only">
            Saved places list
          </h3>
          {me && list.length > 0 && <AccountEmail email={me.accountEmail} />}
          {meError && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-danger/30 bg-[#fdf1f0] px-4 py-3 text-sm text-danger"
            >
              Couldn&apos;t load your saved places: {meError}
            </p>
          )}
          {list.length === 0 ? (
            <div className="panel mt-4 px-6 py-14 text-center">
              <Bookmark className="mx-auto size-8 text-navy-200" aria-hidden />
              <p className="mt-3 text-lg font-semibold text-navy">
                No saved places yet
              </p>
              <p className="mt-1 text-muted">
                Tap the bookmark on any place to keep it here.
              </p>
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
                    <div className="mx-4 -mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-b-xl border border-t-0 border-rule bg-white px-4 py-2.5">
                      <ReminderControl
                        key={JSON.stringify(me?.reminders[p.id] ?? null)}
                        placeId={p.id}
                        reminder={me?.reminders[p.id]}
                        accountEmail={me?.accountEmail ?? ""}
                        closed={statusOf(p) === "closed"}
                      />
                      {total > 0 && (
                        <Link
                          href={`/places/${p.id}`}
                          className="ml-auto flex min-w-[12rem] items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-navy-50"
                        >
                          <FileCheck2
                            className={`size-4 ${done === total ? "text-success" : "text-muted"}`}
                            aria-hidden
                          />
                          <span
                            className={
                              done === total
                                ? "font-semibold text-success"
                                : "text-body"
                            }
                          >
                            {done === total
                              ? "All documents ready"
                              : `${done} of ${total} documents ready`}
                          </span>
                          <span
                            className="h-1.5 w-16 overflow-hidden rounded-full bg-navy-100"
                            aria-hidden
                          >
                            <span
                              className="block h-full rounded-full bg-success"
                              style={{ width: `${(done / total) * 100}%` }}
                            />
                          </span>
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="mt-8 text-sm text-muted">
          Draft: saved places and reminders are stored on the server; your co-op
          request is still kept in this browser until the co-op system is
          connected.
        </p>
      </div>
    </>
  );
}
