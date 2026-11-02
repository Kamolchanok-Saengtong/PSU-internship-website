"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { toggleCompare, useCompareIds } from "@/lib/compare-store";
import { FACULTY_INFO } from "@/lib/faculties";
import { allowanceText, countdown, type Status } from "@/lib/status";
import { TYPE_INFO, placeLocation } from "@/lib/placement";
import type { Place } from "@/lib/types";
import { SaveButton } from "./save-button";
import { StatusBadge } from "./status-badge";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A small calendar leaf for the application deadline. */
export function DateBlock({ iso, status }: { iso: string; status: Status }) {
  const [, m, d] = iso.split("-");
  const strip =
    status === "closed"
      ? "bg-[#5f6678] text-white"
      : status === "final-call"
        ? "bg-gold text-navy-950"
        : "bg-navy text-white";
  return (
    <span className="flex w-16 shrink-0 flex-col overflow-hidden rounded-xl border border-rule bg-white text-center">
      <span className={`py-0.5 text-[0.7rem] font-semibold tracking-wider uppercase ${strip}`}>
        {MONTHS[Number(m) - 1]}
      </span>
      <span className={`tabular py-1.5 text-2xl leading-none font-bold ${status === "closed" ? "text-closed" : "text-navy"}`}>
        {Number(d)}
      </span>
    </span>
  );
}

const TYPE_STYLE = {
  "Part-time": "bg-[#eef6ff] text-[#1d5fa8]",
  "Short-term internship": "bg-[#f3eefc] text-[#5b3aa4]",
  "Co-op": "bg-navy-50 text-navy",
} as const;

/** Small label for the kind of placement. */
export function TypeTag({ type }: { type: keyof typeof TYPE_STYLE }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[0.72rem] font-semibold tracking-wide uppercase ${TYPE_STYLE[type]}`}>
      {TYPE_INFO[type].short}
    </span>
  );
}

export function CompareToggle({ id }: { id: string }) {
  const ids = useCompareIds();
  const on = ids.includes(id);
  const full = ids.length >= 3 && !on;
  return (
    <label
      className={`relative z-10 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium ${
        full ? "cursor-not-allowed text-muted/60" : "cursor-pointer text-muted hover:bg-navy-50 hover:text-navy"
      }`}
      title={full ? "You can compare up to 3 places" : undefined}
    >
      <input type="checkbox" checked={on} disabled={full} onChange={() => toggleCompare(id)} className="size-4" />
      Compare
    </label>
  );
}

/** One internship place in a list: deadline, role, company, allowance and status. */
export function PositionRow({ place: p, status, compact = false }: { place: Place; status: Status; compact?: boolean }) {
  const closed = status === "closed";
  return (
    <li
      className={`group relative flex flex-wrap gap-x-4 gap-y-3 rounded-2xl border border-rule bg-white p-4 transition-[border-color,box-shadow] hover:border-navy-200 hover:shadow-[0_10px_30px_-20px_rgb(15_27_56/0.45)] sm:p-5 ${
        closed ? "opacity-75" : ""
      }`}
    >
      <DateBlock iso={p.closes} status={status} />

      <div className="min-w-0 flex-1 basis-[calc(100%-5rem)] sm:basis-0">
        <TypeTag type={p.placementType} />
        <h3 className="mt-1 text-lg leading-snug font-semibold text-navy">
          <Link
            href={`/places/${p.id}`}
            className={`after:absolute after:inset-0 after:rounded-2xl group-hover:underline ${closed ? "line-through" : ""}`}
          >
            {p.role}
          </Link>
        </h3>
        <p className="mt-0.5 text-[0.95rem] text-body">{p.company}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden /> {placeLocation(p)} · {p.workMode}
          </span>
          <span className={closed ? "" : status === "final-call" ? "font-semibold text-gold-ink" : ""}>
            {countdown(p.closes)}
          </span>
        </p>
        {!compact && (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {p.faculties.map((f) => (
              <li key={f} className="rounded-md bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy">
                {FACULTY_INFO[f].code} · {FACULTY_INFO[f].short}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex w-full shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t border-rule pt-3 sm:w-auto sm:flex-col sm:items-end sm:justify-between sm:border-0 sm:pt-0 sm:text-right">
        <span className="flex items-center gap-1">
          <StatusBadge status={status} />
          <SaveButton placeId={p.id} compact />
        </span>
        <span className="tabular text-[0.95rem] font-semibold text-ink">
          {allowanceText(p.allowance, p.payPer)}
          {p.hoursPerWeek ? <span className="block text-xs font-normal text-muted">{p.hoursPerWeek} hrs/week</span> : null}
        </span>
        {!compact && !closed && (
          <span className="ml-auto sm:ml-0">
            <CompareToggle id={p.id} />
          </span>
        )}
      </div>
    </li>
  );
}
