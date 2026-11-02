"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CornerUpLeft,
  History,
  Paperclip,
  X,
} from "lucide-react";
import {
  APP_STATUSES,
  DETOUR,
  JOURNEY,
  SCHEDULE,
  STATUS_INFO,
  cancelApplication,
  type AppStatus,
  type Application,
  type Period,
} from "@/lib/application";
import { placeLocation } from "@/lib/placement";
import type { Place } from "@/lib/types";
import { TypeTag } from "./position-row";

const STEP_HINT: Record<string, string> = {
  choosing: "You choose a place",
  approving: "Advisor reviews",
  printing: "Office prepares letter",
  waiting: "Company replies",
  accept: "You start co-op",
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const day = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const time = (iso: string) => iso.slice(11, 16);

export function StatusPill({
  status,
  className = "",
}: {
  status: AppStatus;
  className?: string;
}) {
  const s = STATUS_INFO[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase ${s.tone} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${s.dot}`} aria-hidden />
      {s.label}
    </span>
  );
}

/** Today's date as YYYY-MM-DD in local time. */
function todayIso() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

export function ApplicationPanel({
  app,
  place,
}: {
  app: Application;
  place: Place | undefined;
}) {
  const info = STATUS_INFO[app.status];
  const choosingPeriod = SCHEDULE.find((p) =>
    p.label.startsWith(app.status === "choosing" ? "Choosing" : "Rechoosing"),
  );

  return (
    <>
      <section
        aria-labelledby="app-title"
        className="grid gap-5 lg:grid-cols-[1fr_20rem]"
      >
        <div className="min-w-0 space-y-5">
          {/* Current status */}
          <div className="panel overflow-hidden">
            <div
              className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${info.tone}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="app-title" className="text-lg font-bold">
                  Co-op application
                </h2>
                <span className="rounded-md bg-white/70 px-2 py-0.5 text-xs font-semibold">
                  #{app.number}
                </span>
                <span className="rounded-md bg-white/70 px-2 py-0.5 text-xs font-semibold">
                  {app.code}
                </span>
              </div>
              <span className="text-xs font-medium opacity-80">
                Started {day(app.created)}, {time(app.created)}
              </span>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted">Current status</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                <StatusPill status={app.status} className="px-3 py-1 text-sm" />
                <p className="font-semibold text-ink">{info.en}</p>
              </div>
              <p className="mt-1 text-sm text-muted" lang="th">
                {info.th}
              </p>
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-rule bg-[#fafbfd] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-navy">
                    What to do next
                  </p>
                  <p className="mt-0.5 text-[0.95rem] text-body">
                    {info.next}
                    {info.action && choosingPeriod && (
                      <>
                        {" "}
                        Deadline:{" "}
                        <strong className="text-ink">
                          {day(choosingPeriod.to)}
                        </strong>
                        .
                      </>
                    )}
                  </p>
                </div>
                {info.action === "choose" && (
                  <Link
                    href="/positions?type=co-op"
                    className="btn-primary h-10 shrink-0 text-sm"
                  >
                    {app.status === "cancel"
                      ? "Start a new request"
                      : "Choose a new place"}{" "}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                )}
              </div>

              <Journey status={app.status} />
            </div>
          </div>

          {/* Chosen place */}
          {place && (
            <div className="panel p-5">
              <h3 className="font-semibold text-navy">
                {["repair", "rechoosing", "cancel"].includes(app.status)
                  ? "Last place you chose"
                  : "Your chosen place"}
              </h3>
              <Link
                href={`/places/${place.id}`}
                className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-rule p-4 transition-colors hover:border-navy-200 hover:bg-[#fafbfd]"
              >
                <span className="min-w-0">
                  <TypeTag type={place.placementType} />
                  <span className="mt-1 block font-semibold text-navy">
                    {place.role}
                  </span>
                  <span className="block truncate text-sm text-muted">
                    {place.company} · {placeLocation(place)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <StatusPill status={app.status} />
                  <ArrowRight className="size-4 text-muted" aria-hidden />
                </span>
              </Link>
            </div>
          )}

          {/* History */}
          <div className="panel p-5">
            <h3 className="flex items-center gap-2 font-semibold text-navy">
              <History className="size-4" aria-hidden /> History
            </h3>
            <ol className="mt-4 space-y-0">
              {[...app.history].reverse().map((h, i) => (
                <li
                  key={h.at + h.status}
                  className="relative flex gap-4 pb-5 last:pb-0"
                >
                  {i < app.history.length - 1 && (
                    <span
                      className="absolute top-6 bottom-0 left-[0.6875rem] w-px bg-rule"
                      aria-hidden
                    />
                  )}
                  <span
                    className={`relative mt-1 grid size-[1.375rem] shrink-0 place-items-center rounded-full ring-4 ring-white ${STATUS_INFO[h.status].dot}`}
                  >
                    {i === 0 ? (
                      <span className="size-2 rounded-full bg-white" />
                    ) : (
                      <Check className="size-3 text-white" strokeWidth={3} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={h.status} />
                      <span className="tabular text-sm text-muted">
                        {day(h.at)}, {time(h.at)}
                      </span>
                    </div>
                    <p className="mt-1 text-[0.95rem] text-body">{h.note}</p>
                    <p className="text-xs text-muted">
                      {h.by === "student"
                        ? "You"
                        : h.by === "advisor"
                          ? "Advisor"
                          : "Co-op office"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* What was sent */}
          <div className="panel p-5">
            <h3 className="font-semibold text-navy">What you sent</h3>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-muted">English</p>
                <dl className="mt-2 space-y-1.5">
                  {app.language.map((l) => (
                    <div
                      key={l.skill}
                      className="flex justify-between gap-4 border-b border-rule pb-1.5 text-[0.95rem]"
                    >
                      <dt className="text-body">{l.skill}</dt>
                      <dd className="font-medium text-ink">{l.level}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted">Activities</p>
                {app.activities.length ? (
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[0.95rem] text-body marker:text-navy-200">
                    {app.activities.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[0.95rem] text-muted">None</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm font-semibold text-muted">
                  Why this place
                </p>
                <p className="mt-1.5 text-[0.95rem] text-body">
                  {app.motivation}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm font-semibold text-muted">Documents</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {app.documents.map((d) => (
                    <li
                      key={d.name}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-[#fafbfd] px-2.5 py-1.5 text-sm"
                    >
                      <Paperclip className="size-3.5 text-muted" aria-hidden />
                      <span className="font-medium text-ink">{d.name}</span>
                      <span className="text-muted">· {d.file}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {["approving", "printing", "waiting"].includes(app.status) && (
              <CancelRequest number={app.number} />
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <Schedule periods={SCHEDULE} />
        </aside>
      </section>
      <StatusGuide current={app.status} />
    </>
  );
}

/** Main steps, with the detour shown on the step it loops back from. With no status, it just explains the steps. */
export function Journey({ status }: { status: AppStatus | null }) {
  const detourFrom = status ? DETOUR[status] : undefined;
  const cancelled = status === "cancel";
  const at = !status
    ? -1
    : detourFrom
      ? JOURNEY.indexOf(detourFrom)
      : cancelled
        ? -1
        : JOURNEY.indexOf(status);

  return (
    <div className="mt-6">
      {status && (
        <p className="text-sm font-semibold text-navy">Your progress</p>
      )}
      <ol className={`grid grid-cols-5 gap-1 ${status ? "mt-4" : ""}`}>
        {JOURNEY.map((s, i) => {
          const done = !cancelled && i < at;
          const now = !cancelled && i === at;
          const looped = now && detourFrom;
          const finished = now && s === "accept";
          return (
            <li
              key={s}
              className="relative flex flex-col items-center text-center"
              aria-current={now ? "step" : undefined}
            >
              {i > 0 && (
                <span
                  className={`absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2 ${done || now ? "bg-navy" : "bg-navy-100"}`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 grid size-8 place-items-center rounded-full border-2 text-xs font-bold ${
                  looped
                    ? `${STATUS_INFO[status!].dot} border-transparent text-white`
                    : finished
                      ? "border-success bg-success text-white ring-4 ring-[#e3f4ec]"
                      : now
                        ? "border-navy bg-navy text-white ring-4 ring-navy-100"
                        : done
                          ? "border-navy bg-navy text-white"
                          : "border-navy-200 bg-white text-muted"
                }`}
              >
                {looped ? (
                  <CornerUpLeft className="size-4" aria-hidden />
                ) : done || finished ? (
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`mt-2 text-xs font-semibold sm:text-sm ${done || now ? "text-navy" : "text-muted"}`}
              >
                {STATUS_INFO[s].label}
              </span>
              {!status && (
                <span className="mt-0.5 hidden text-xs text-muted sm:block">
                  {STEP_HINT[s]}
                </span>
              )}
              {looped && (
                <span className="mt-0.5 text-[0.7rem] font-semibold text-muted sm:text-xs">
                  {STATUS_INFO[status!].label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {cancelled && (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-[#eceef3] px-3 py-2 text-sm text-[#5f6678]">
          <X className="size-4" aria-hidden /> This application was cancelled.
        </p>
      )}
      {detourFrom && (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-[#fafbfd] px-3 py-2 text-sm text-body">
          <CornerUpLeft
            className="mt-0.5 size-4 shrink-0 text-muted"
            aria-hidden
          />
          <span>
            {status === "repair"
              ? "The company declined"
              : "Your advisor declined"}
            , so you go back a step: choose a new place, and it goes to{" "}
            {status === "repair" ? "the company" : "your advisor"} again.
          </span>
        </p>
      )}
    </div>
  );
}

export function Schedule({ periods = SCHEDULE }: { periods?: Period[] }) {
  const today = todayIso();
  return (
    <div className="panel p-5">
      <h3 className="flex items-center gap-2 font-semibold text-navy">
        <CalendarDays className="size-4" aria-hidden /> Schedule
      </h3>
      <p className="text-sm text-muted">Today is {day(today)}</p>
      <ul className="mt-4 space-y-2.5">
        {periods.map((p) => {
          const state =
            today < p.from ? "upcoming" : today > p.to ? "ended" : "open";
          return (
            <li
              key={p.label}
              className={`rounded-xl border px-4 py-3 ${
                state === "open"
                  ? "border-gold bg-gold-soft/50"
                  : state === "ended"
                    ? "border-rule bg-[#f5f6f9]"
                    : "border-rule bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`font-semibold ${state === "ended" ? "text-muted" : "text-navy"}`}
                >
                  {p.label}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    state === "open"
                      ? "bg-gold text-navy-950"
                      : state === "ended"
                        ? "bg-[#e3e6ec] text-[#5f6678]"
                        : "bg-navy-50 text-navy"
                  }`}
                >
                  {state === "open"
                    ? "Open now"
                    : state === "ended"
                      ? "Ended"
                      : "Upcoming"}
                </span>
              </div>
              <p
                className={`tabular mt-1 text-sm ${state === "ended" ? "text-muted line-through decoration-1" : "text-body"}`}
              >
                {day(p.from)} – {day(p.to)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function StatusGuide({ current }: { current?: AppStatus }) {
  return (
    <section aria-labelledby="guide-title" className="panel mt-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="guide-title" className="font-semibold text-navy">
          What each status means
        </h2>
        <p className="text-sm text-muted">ความหมายของสถานะ</p>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {APP_STATUSES.map((s) => {
          const on = s === current;
          return (
            <li
              key={s}
              aria-current={on ? "true" : undefined}
              className={`relative rounded-xl border p-3.5 ${on ? "border-navy bg-navy-50 shadow-[0_0_0_1px_var(--color-navy)]" : "border-rule bg-white"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <StatusPill status={s} />
                {on && (
                  <span className="text-xs font-semibold text-navy">
                    You are here
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-ink">
                {STATUS_INFO[s].en}
              </p>
              <p
                className="mt-0.5 text-xs leading-relaxed text-muted"
                lang="th"
              >
                {STATUS_INFO[s].th}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CancelRequest({ number }: { number: number }) {
  const [ask, setAsk] = useState(false);
  return ask ? (
    <div
      className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-danger/30 bg-[#fdf1f0] px-4 py-3"
      role="alert"
    >
      <span className="text-sm text-ink">
        Cancel this co-op request? Your advisor and the co-op office will see it
        as cancelled.
      </span>
      <span className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={() => setAsk(false)}
          className="btn-secondary h-9 text-sm"
        >
          Keep it
        </button>
        <button
          type="button"
          onClick={() => cancelApplication(number)}
          className="btn-danger h-9 text-sm"
        >
          Cancel request
        </button>
      </span>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setAsk(true)}
      className="mt-5 text-sm font-semibold text-muted hover:text-danger"
    >
      Cancel this request
    </button>
  );
}
