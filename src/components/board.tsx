"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { usePlaces } from "@/lib/store";
import { statusOf, type Status } from "@/lib/status";
import { FACULTIES, PLACEMENT_TYPES, PROVINCES, WORK_MODES, type Faculty, type PlacementType, type Province } from "@/lib/types";
import { TYPE_INFO, monthlyPay } from "@/lib/placement";
import { FACULTY_INFO } from "@/lib/faculties";
import { PositionRow } from "./position-row";

const ORDER: Record<Status, number> = { "final-call": 0, "closing-soon": 0, open: 0, closed: 1 };

type SortKey = "deadline" | "allowance" | "seats" | "company";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "deadline", label: "Deadline (soonest)" },
  { key: "allowance", label: "Allowance (highest)" },
  { key: "seats", label: "Seats (most)" },
  { key: "company", label: "Company (A–Z)" },
];

export function Board({
  initialFaculty,
  initialProvince,
  initialType,
  initialQuery = "",
}: {
  initialFaculty?: Faculty;
  initialProvince?: Province;
  initialType?: PlacementType;
  initialQuery?: string;
}) {
  const places = usePlaces();
  const [query, setQuery] = useState(initialQuery);
  const [faculty, setFaculty] = useState<Faculty | "all">(initialFaculty ?? "all");
  const [province, setProvince] = useState<string>(initialProvince ?? "all");
  const [type, setType] = useState<PlacementType | "all">(initialType ?? "all");
  const [mode, setMode] = useState("all");
  const [paidOnly, setPaidOnly] = useState(false);
  const [showClosed, setShowClosed] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("deadline");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const rows = useMemo(() => {
    if (!places) return [];
    const q = query.trim().toLowerCase();
    return places
      .map((p) => ({ place: p, status: statusOf(p) }))
      .filter(({ place: p, status }) => {
        if (faculty !== "all" && !p.faculties.includes(faculty)) return false;
        if (province !== "all" && p.province !== province) return false;
        if (type !== "all" && p.placementType !== type) return false;
        if (mode !== "all" && p.workMode !== mode) return false;
        if (paidOnly && p.allowance === 0) return false;
        if (!showClosed && status === "closed") return false;
        if (q && !`${p.company} ${p.role} ${p.summary} ${p.area} ${p.province}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        // Closed places always go last.
        const statusDiff = ORDER[a.status] - ORDER[b.status];
        if (statusDiff !== 0) return statusDiff;
        switch (sortBy) {
          case "allowance":
            return monthlyPay(b.place) - monthlyPay(a.place);
          case "seats":
            return b.place.seats - a.place.seats;
          case "company":
            return a.place.company.localeCompare(b.place.company);
          case "deadline":
          default:
            return a.place.closes.localeCompare(b.place.closes);
        }
      });
  }, [places, query, faculty, province, type, mode, paidOnly, showClosed, sortBy]);

  const activeFilters =
    (faculty !== "all" ? 1 : 0) + (province !== "all" ? 1 : 0) + (mode !== "all" ? 1 : 0) + (paidOnly ? 1 : 0) + (showClosed ? 0 : 1);
  const filtered = query !== "" || type !== "all" || activeFilters > 0;
  const typeCount = (t: PlacementType | "all") =>
    (places ?? []).filter((p) => (t === "all" || p.placementType === t) && (showClosed || statusOf(p) !== "closed")).length;
  const openCount = rows.filter((r) => r.status !== "closed").length;

  function clearFilters() {
    setQuery("");
    setFaculty("all");
    setProvince("all");
    setType("all");
    setMode("all");
    setPaidOnly(false);
    setShowClosed(true);
  }

  return (
    <>
      <section className="hero-band">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-10 sm:px-6 sm:pt-12">
          <h1 className="text-[clamp(2rem,4.5vw,2.75rem)] leading-tight font-bold tracking-[-0.02em] text-navy">
            All positions
          </h1>
          <p className="mt-2 max-w-2xl text-body">
            Part-time jobs, short-term internships and co-op placements in Phuket and across Thailand.
          </p>
          <label className="relative mt-6 block max-w-2xl">
            <span className="sr-only">Search role, company or keyword</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search role, company or keyword"
              className="field h-12 bg-white pl-11 text-base shadow-[0_8px_24px_-18px_rgb(15_27_56/0.5)]"
            />
          </label>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 pt-8 sm:px-6 lg:grid-cols-[16.5rem_1fr] lg:gap-8">
        {/* Filters */}
        <aside aria-label="Filters" className="lg:sticky lg:top-24 lg:h-fit">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            aria-controls="filters"
            className="btn-secondary w-full lg:hidden"
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Filters{activeFilters ? ` (${activeFilters})` : ""}
          </button>

          <div id="filters" className={`panel mt-3 space-y-6 p-5 lg:mt-0 lg:block ${filtersOpen ? "block" : "hidden"}`}>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-navy">Faculty</legend>
              <div className="space-y-1">
                {(["all", ...FACULTIES] as const).map((f) => (
                  <label
                    key={f}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[0.95rem] ${
                      faculty === f ? "bg-navy-50 font-medium text-navy" : "text-body hover:bg-navy-50/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="faculty"
                      checked={faculty === f}
                      onChange={() => setFaculty(f)}
                      className="size-4"
                    />
                    {f === "all" ? "All faculties" : `${FACULTY_INFO[f].code} · ${FACULTY_INFO[f].short}`}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-navy">Province</span>
              <select value={province} onChange={(e) => setProvince(e.target.value)} className="field">
                <option value="all">All of Thailand</option>
                {PROVINCES.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-navy">Work mode</span>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className="field">
                <option value="all">Any work mode</option>
                {WORK_MODES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>

            <div className="space-y-2 text-[0.95rem] text-body">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={paidOnly} onChange={(e) => setPaidOnly(e.target.checked)} className="size-4" />
                Paid places only
              </label>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={showClosed}
                  onChange={(e) => setShowClosed(e.target.checked)}
                  className="size-4"
                />
                Show closed places
              </label>
            </div>

            {filtered && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:underline"
              >
                <X className="size-4" aria-hidden /> Clear all filters
              </button>
            )}
          </div>
        </aside>

        {/* Results */}
        <section aria-labelledby="results-title" className="min-w-0">
          <div role="group" aria-label="Type of placement" className="type-tabs mb-5">
            {(["all", ...PLACEMENT_TYPES] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={type === t}
                onClick={() => setType(t)}
                className="type-tab"
              >
                {t === "all" ? "All types" : TYPE_INFO[t].short}
                <span className="tabular type-tab-count">{places ? typeCount(t) : "…"}</span>
              </button>
            ))}
          </div>
          {type !== "all" && (
            <p className="-mt-2 mb-5 text-sm text-muted">
              <span className="font-semibold text-navy">{TYPE_INFO[type].length}.</span> {TYPE_INFO[type].text}
            </p>
          )}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="results-title" className="text-[0.95rem] text-muted" aria-live="polite">
              {places === null ? (
                "Loading places…"
              ) : (
                <>
                  <span className="font-semibold text-ink">{rows.length}</span> {rows.length === 1 ? "place" : "places"}
                  {rows.length !== openCount && <> · {openCount} open</>}
                </>
              )}
            </h2>
            <label className="flex items-center gap-2 text-sm text-muted">
              Sort by
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="field h-10 w-auto bg-white text-sm"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {places === null ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-white" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="panel px-5 py-14 text-center">
              <p className="text-lg font-semibold text-navy">No places match these filters</p>
              <p className="mt-1 text-muted">Try another type, faculty or province, or clear the filters to see everything.</p>
              {filtered && (
                <button type="button" onClick={clearFilters} className="btn-primary mt-5">
                  <X className="size-4" aria-hidden /> Clear filters
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {rows.map(({ place, status }) => (
                <PositionRow key={place.id} place={place} status={status} />
              ))}
            </ul>
          )}

          <p className="mt-8 text-sm text-muted">
            Sample listings for the draft. Companies and contacts are invented; staff replace them from the Staff page.
          </p>
        </section>
      </div>
    </>
  );
}
