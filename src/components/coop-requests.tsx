"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, CircleCheck, ExternalLink, FileText, Inbox, Search, Send, X } from "lucide-react";
import {
  STATUS_INFO,
  advisorApprove,
  advisorDecline,
  companyAccepted,
  companyDeclined,
  markLetterSent,
  useApplications,
  type AppStatus,
  type Application,
} from "@/lib/application";
import { placeLocation } from "@/lib/placement";
import { usePlaces } from "@/lib/store";
import type { Place } from "@/lib/types";
import { StatusPill } from "./application-panel";

const fmtSize = (b: number) => (b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`);

const QUEUES: { key: string; label: string; statuses: AppStatus[]; who: string }[] = [
  { key: "advisor", label: "Needs advisor", statuses: ["approving"], who: "Advisor" },
  { key: "letter", label: "Send letter", statuses: ["printing"], who: "Co-op office" },
  { key: "company", label: "Waiting for company", statuses: ["waiting"], who: "Co-op office" },
  { key: "done", label: "Finished", statuses: ["accept", "repair", "rechoosing", "cancel", "choosing"], who: "" },
  { key: "all", label: "All", statuses: [...Object.keys(STATUS_INFO)] as AppStatus[], who: "" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const when = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}, ${iso.slice(11, 16)}`;
};

export function CoopRequests() {
  const apps = useApplications();
  const places = usePlaces();
  const [queue, setQueue] = useState("advisor");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const q = QUEUES.find((x) => x.key === queue)!;
  const placeOf = (a: Application) => places?.find((p) => p.id === a.placeId);
  const rows = useMemo(() => {
    const s = query.trim().toLowerCase();
    return apps
      .filter((a) => q.statuses.includes(a.status))
      .filter((a) => !s || `${a.name} ${a.studentId} ${a.major}`.toLowerCase().includes(s))
      .sort((a, b) => a.updated.localeCompare(b.updated));
  }, [apps, q, query]);

  const current = apps.find((a) => a.number === open);

  function done(text: string) {
    setOpen(null);
    setToast(text);
    window.setTimeout(() => setToast(null), 4000);
  }

  return (
    <>
      <section className="hero-band">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:px-6 sm:pt-12">
          <h1 className="text-[clamp(1.9rem,4vw,2.5rem)] leading-tight font-bold tracking-[-0.02em] text-navy">Co-op requests</h1>
          <p className="mt-1 text-body">Review students&apos; co-op requests: advisors approve, then the co-op office sends the letter.</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {QUEUES.map((x) => {
            const n = apps.filter((a) => x.statuses.includes(a.status)).length;
            const on = queue === x.key;
            return (
              <li key={x.key}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setQueue(x.key)}
                  className={`panel w-full p-4 text-left transition-[border-color,box-shadow] hover:border-navy-200 ${
                    on ? "border-navy shadow-[0_0_0_1px_var(--color-navy)]" : ""
                  }`}
                >
                  <span className="tabular block text-2xl leading-none font-bold text-navy">{n}</span>
                  <span className="mt-1 block text-sm text-body">{x.label}</span>
                  {x.who && <span className="block text-xs text-muted">{x.who}</span>}
                </button>
              </li>
            );
          })}
        </ul>

        <section className="panel mt-6 overflow-hidden" aria-label="Requests">
          <div className="border-b border-rule p-4">
            <label className="relative block max-w-md">
              <span className="sr-only">Search students</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, student ID or major"
                className="field h-10 pl-9 text-sm"
              />
            </label>
          </div>

          {rows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Inbox className="mx-auto size-8 text-navy-200" aria-hidden />
              <p className="mt-3 font-semibold text-navy">{apps.length ? "Nothing here" : "No co-op requests yet"}</p>
              <p className="mt-1 text-sm text-muted">
                {apps.length
                  ? "No requests in this group right now."
                  : "When a student sends a co-op request, it appears here for their advisor."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-rule">
              {rows.map((a) => {
                const p = placeOf(a);
                return (
                  <li key={a.number} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3.5 hover:bg-[#fafbfd]">
                    <div className="min-w-[12rem] flex-1">
                      <p className="font-semibold text-navy">{a.name}</p>
                      <p className="text-sm text-muted">
                        <span className="tabular">{a.studentId}</span> · {a.major}
                      </p>
                    </div>
                    <div className="min-w-[12rem] flex-1">
                      <p className="truncate text-[0.95rem] text-ink">{p?.role ?? "Removed place"}</p>
                      <p className="truncate text-sm text-muted">{p?.company}</p>
                    </div>
                    <div className="w-36">
                      <StatusPill status={a.status} />
                      <p className="mt-1 text-xs text-muted">{when(a.updated)}</p>
                    </div>
                    <button type="button" onClick={() => setOpen(a.number)} className="btn-secondary h-9 text-sm">
                      Review <ArrowRight className="size-4" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {current && <ReviewPanel app={current} place={placeOf(current)} onClose={() => setOpen(null)} onDone={done} />}

      {toast && (
        <div className="toast fixed right-4 bottom-4 z-[70] flex items-center gap-3 rounded-xl bg-navy-950 px-4 py-3 text-sm text-white shadow-[0_18px_40px_-16px_rgb(15_27_56/0.7)]" role="status">
          <CircleCheck className="size-4 text-gold" aria-hidden /> {toast}
        </div>
      )}
    </>
  );
}

function ReviewPanel({
  app: a,
  place,
  onClose,
  onDone,
}: {
  app: Application;
  place: Place | undefined;
  onClose: () => void;
  onDone: (text: string) => void;
}) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = overflow;
      prev?.focus();
    };
  }, [onClose]);

  const company = place?.company ?? "the company";

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="presentation">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="drawer-backdrop absolute inset-0 bg-navy-950/40 backdrop-blur-[2px]" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Co-op request from ${a.name}`}
        data-lenis-prevent
        className="drawer-panel relative flex h-full w-full max-w-2xl flex-col bg-ground shadow-[-24px_0_60px_-20px_rgb(15_27_56/0.45)] focus:outline-none"
      >
        <header className="flex items-start justify-between gap-4 border-b border-rule bg-white px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <StatusPill status={a.status} /> #{a.number} · {a.code}
            </p>
            <h2 className="mt-1 truncate text-xl font-bold text-navy">{a.name}</h2>
            <p className="text-sm text-muted">
              <span className="tabular">{a.studentId}</span> · {a.faculty} · {a.major} · Year {a.year}
              {a.gpa && ` · GPA ${a.gpa}`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-navy-50 hover:text-navy">
            <X className="size-5" aria-hidden />
            <span className="sr-only">Close</span>
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
          <Box title="Place">
            {place ? (
              <Link href={`/places/${place.id}`} target="_blank" className="flex items-center justify-between gap-3 rounded-xl border border-rule p-3 hover:bg-[#fafbfd]">
                <span className="min-w-0">
                  <span className="block font-semibold text-navy">{place.role}</span>
                  <span className="block truncate text-sm text-muted">
                    {place.company} · {placeLocation(place)}
                  </span>
                </span>
                <ExternalLink className="size-4 shrink-0 text-muted" aria-hidden />
              </Link>
            ) : (
              <p className="text-sm text-muted">This place has been removed.</p>
            )}
          </Box>

          <Box title="Why this place">
            <p className="text-[0.95rem] text-body">{a.motivation}</p>
          </Box>

          <Box title="Documents">
            <ul className="space-y-2">
              {a.documents.map((d) => (
                <li key={d.name} className="flex items-center gap-3 rounded-lg border border-rule bg-white px-3 py-2">
                  <FileText className="size-4 text-muted" aria-hidden />
                  <span className="flex-1 text-sm">
                    <span className="font-medium text-ink">{d.name}</span>
                    <span className="block text-xs text-muted">
                      {d.file} · {fmtSize(d.size)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">Draft: files are not uploaded yet, so they can&apos;t be opened here.</p>
          </Box>

          <div className="grid gap-4 sm:grid-cols-2">
            <Box title="English">
              <dl className="space-y-1 text-sm">
                {a.language.map((l) => (
                  <div key={l.skill} className="flex justify-between">
                    <dt className="text-body">{l.skill}</dt>
                    <dd className="font-medium text-ink">{l.level}</dd>
                  </div>
                ))}
              </dl>
            </Box>
            <Box title="Contact">
              <p className="text-sm text-ink">{a.phone}</p>
              <p className="text-sm break-all text-navy-600">{a.email}</p>
              {a.activities.length > 0 && (
                <>
                  <p className="mt-3 text-xs font-semibold text-muted">Activities</p>
                  <p className="text-sm text-body">{a.activities.join(" · ")}</p>
                </>
              )}
            </Box>
          </div>

          <Box title="History">
            <ol className="space-y-2.5">
              {[...a.history].reverse().map((h) => (
                <li key={h.at + h.status} className="flex flex-wrap items-center gap-2 text-sm">
                  <StatusPill status={h.status} />
                  <span className="text-ink">{h.note}</span>
                  <span className="text-xs text-muted">· {when(h.at)}</span>
                </li>
              ))}
            </ol>
          </Box>
        </div>

        <footer className="border-t border-rule bg-white px-5 py-3.5 sm:px-7">
          {declining ? (
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-semibold text-navy">
                  {a.status === "approving" ? "Why are you declining?" : `Why did ${company} decline?`}
                </span>
                <span className="block text-xs text-muted">The student sees this and chooses a new place.</span>
                <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className="field mt-1.5 h-auto py-2 text-sm" autoFocus />
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setDeclining(false)} className="btn-secondary h-10 text-sm">
                  Back
                </button>
                <button
                  type="button"
                  disabled={!reason.trim()}
                  onClick={() => {
                    if (a.status === "approving") {
                      advisorDecline(a.number, reason.trim());
                      onDone(`Declined. ${a.name} will choose a new place.`);
                    } else {
                      companyDeclined(a.number, reason.trim());
                      onDone(`Recorded. ${a.name} will choose a new place.`);
                    }
                  }}
                  className="btn-danger h-10 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </div>
          ) : a.status === "approving" ? (
            <Actions
              note="Advisor: check the place and documents."
              secondary={{ label: "Decline", onClick: () => setDeclining(true) }}
              primary={{
                label: "Approve",
                icon: <Check className="size-4" aria-hidden />,
                onClick: () => {
                  advisorApprove(a.number);
                  onDone(`Approved. ${a.name}'s request moves to the co-op office.`);
                },
              }}
            />
          ) : a.status === "printing" ? (
            <Actions
              note="Co-op office: prepare and send the request letter."
              primary={{
                label: `Mark letter sent to ${company}`,
                icon: <Send className="size-4" aria-hidden />,
                onClick: () => {
                  markLetterSent(a.number, company);
                  onDone(`Letter marked as sent. Waiting for ${company}.`);
                },
              }}
            />
          ) : a.status === "waiting" ? (
            <Actions
              note={`Record ${company}'s reply.`}
              secondary={{ label: "Company declined", onClick: () => setDeclining(true) }}
              primary={{
                label: "Company accepted",
                icon: <Check className="size-4" aria-hidden />,
                onClick: () => {
                  companyAccepted(a.number);
                  onDone(`${a.name} has been accepted.`);
                },
              }}
            />
          ) : (
            <p className="text-sm text-muted">Nothing to do: {STATUS_INFO[a.status].en.toLowerCase()}</p>
          )}
        </footer>
      </div>
    </div>
  );
}

function Actions({
  note,
  primary,
  secondary,
}: {
  note: string;
  primary: { label: string; icon: React.ReactNode; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">{note}</p>
      <div className="ml-auto flex gap-2">
        {secondary && (
          <button type="button" onClick={secondary.onClick} className="btn-secondary h-10 text-sm text-danger">
            {secondary.label}
          </button>
        )}
        <button type="button" onClick={primary.onClick} className="btn-primary h-10 text-sm">
          {primary.icon} {primary.label}
        </button>
      </div>
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel p-4">
      <h3 className="mb-2.5 text-sm font-semibold text-navy">{title}</h3>
      {children}
    </section>
  );
}
