"use client";

import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { usePlaces } from "@/lib/store";
import { useCompareIds, clearCompare } from "@/lib/compare-store";
import { statusOf, longDate, countdown } from "@/lib/status";
import { FACULTY_INFO } from "@/lib/faculties";
import { StatusBadge } from "./status-badge";
import { PayTag } from "./pay-tag";
import type { Place } from "@/lib/types";
import { durationText, monthlyPay, placeLocation } from "@/lib/placement";

type Row = {
  label: string;
  render: (place: Place, allPlaces: Place[]) => React.ReactNode;
};

function highestAllowance(places: Place[]): number {
  return Math.max(...places.map(monthlyPay));
}

const rows: Row[] = [
  {
    label: "Company",
    render: (p) => <span className="font-semibold text-ink">{p.company}</span>,
  },
  {
    label: "Role",
    render: (p) => <span className="text-ink">{p.role}</span>,
  },
  {
    label: "Type",
    render: (p) => <span className="font-medium text-navy">{p.placementType}</span>,
  },
  {
    label: "Status",
    render: (p) => <StatusBadge status={statusOf(p)} />,
  },
  {
    label: "Deadline",
    render: (p) => (
      <div>
        <span className="text-ink">{longDate(p.closes)}</span>
        <span className="mt-0.5 block text-sm text-muted">{countdown(p.closes)}</span>
      </div>
    ),
  },
  {
    label: "Period",
    render: (p) => (
      <span className="text-ink">
        {longDate(p.starts)} – {longDate(p.ends)}
        <span className="mt-0.5 block text-sm text-muted">{durationText(p.starts, p.ends)}</span>
      </span>
    ),
  },
  {
    label: "Location",
    render: (p) => (
      <span className="text-ink">
        {placeLocation(p)} · <span className="text-muted">{p.workMode}</span>
      </span>
    ),
  },
  {
    label: "Allowance",
    render: (p, all) => {
      const best = highestAllowance(all);
      const isBest = p.allowance > 0 && monthlyPay(p) === best && all.length > 1;
      return (
        <span className="flex flex-wrap items-center gap-1.5">
          <PayTag place={p} size="sm" />
          {isBest && <span className="ml-1.5 rounded-full bg-[#e3f4ec] px-2 py-0.5 text-xs font-semibold text-success">Highest</span>}
        </span>
      );
    },
  },
  {
    label: "Seats",
    render: (p) => <span className="tabular text-ink">{p.seats}</span>,
  },
  {
    label: "Faculties",
    render: (p) => (
      <div className="flex flex-wrap gap-1.5">
        {p.faculties.map((f) => {
          const info = FACULTY_INFO[f];
          return (
            <span
              key={f}
              className="inline-flex items-center rounded-md bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy"
            >
              <span className="mr-1 font-semibold">{info.code}</span>
              {info.short}
            </span>
          );
        })}
      </div>
    ),
  },
  {
    label: "Benefits",
    render: (p) => (
      <ul className="list-disc space-y-1 pl-4 text-body marker:text-navy-200">
        {(p.benefits ?? []).map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    ),
  },
  {
    label: "Documents",
    render: (p) => (
      <ul className="list-disc space-y-1 pl-4 text-body marker:text-navy-200">
        {(p.documents ?? []).map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    ),
  },
  {
    label: "How to apply",
    render: (p) => <span className="text-body">{p.howToApply}</span>,
  },
  {
    label: "Contact",
    render: (p) => (
      <div>
        <span className="text-ink">{p.contactName}</span>
        <span className="mt-0.5 block break-all text-sm text-muted">{p.contactEmail}</span>
      </div>
    ),
  },
];

export function CompareTable() {
  const ids = useCompareIds();
  const allPlaces = usePlaces();

  if (allPlaces === null) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-muted sm:px-6">Loading places…</div>;
  }

  const places = ids.map((id) => allPlaces.find((p) => p.id === id)).filter(Boolean) as Place[];

  return (
    <>
      <section className="hero-band">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 pt-10 pb-10 sm:px-6 sm:pt-12">
          <div>
            <h1 className="text-[clamp(2rem,4.5vw,2.75rem)] leading-tight font-bold tracking-[-0.02em] text-navy">
              Compare places
            </h1>
            <p className="mt-2 max-w-2xl text-body">Up to 3 internship places side by side.</p>
          </div>
          {places.length > 0 && (
            <button type="button" onClick={clearCompare} className="btn-secondary h-10 text-sm">
              <Trash2 className="size-4" aria-hidden />
              Clear selection
            </button>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        {places.length < 2 ? (
          <div className="panel px-5 py-14 text-center">
            <p className="text-lg font-semibold text-navy">Choose at least 2 places to compare</p>
            <p className="mt-1 text-muted">
              Tick &ldquo;Compare&rdquo; on up to 3 places in the positions list, then come back here.
            </p>
            <Link href="/positions" className="btn-primary mt-5">
              <ArrowLeft className="size-4" aria-hidden />
              Browse positions
            </Link>
          </div>
        ) : (
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-rule bg-navy-50">
                    <th className="w-40 px-5 py-4">
                      <span className="sr-only">Detail</span>
                    </th>
                    {places.map((place) => (
                      <th key={place.id} className="px-5 py-4 text-lg font-bold text-navy">
                        <Link href={`/places/${place.id}`} className="hover:underline">
                          {place.role}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={row.label} className={`border-b border-rule last:border-b-0 ${ri % 2 === 1 ? "bg-[#fafbfd]" : ""}`}>
                      <th scope="row" className="px-5 py-3.5 align-top text-xs font-semibold tracking-wide text-muted uppercase">
                        {row.label}
                      </th>
                      {places.map((place) => (
                        <td key={place.id} className="px-5 py-3.5 align-top text-[0.95rem]">
                          {row.render(place, places)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="mt-8 text-sm text-muted">
          To change your selection, tick or untick &ldquo;Compare&rdquo; in the positions list.
        </p>
      </div>
    </>
  );
}
