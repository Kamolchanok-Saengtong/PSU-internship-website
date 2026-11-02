"use client";

import { useMemo, useState } from "react";
import { Inbox, Search } from "lucide-react";
import { FACULTY_INFO } from "@/lib/faculties";
import { KIND_INFO, RESOURCE_KINDS, type Program, type ResourceKind } from "@/lib/resources";
import { useResources } from "@/lib/resources-client";
import { FACULTIES } from "@/lib/types";
import { ResourceAction, ResourceRow, splitTitle, KIND_ICON } from "./resource-item";

export function ResourcesPage() {
  const { list, error } = useResources();
  const [kind, setKind] = useState<ResourceKind | "all">("all");
  const [program, setProgram] = useState<Program | "all">("all");
  const [faculty, setFaculty] = useState("all");
  const [query, setQuery] = useState("");

  const all = useMemo(() => list ?? [], [list]);
  const pinned = all.filter((r) => r.pinned);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      (r) =>
        (kind === "all" || r.kind === kind) &&
        (program === "all" || r.program === program || r.program === "both") &&
        (faculty === "all" || r.faculty === faculty || r.faculty === "all") &&
        (!q || `${r.title} ${r.summary ?? ""}`.toLowerCase().includes(q)),
    );
  }, [all, kind, program, faculty, query]);

  return (
    <>
      <section className="hero-band">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-10 sm:px-6 sm:pt-12">
          <h1 className="text-[clamp(2rem,4.5vw,2.75rem)] leading-tight font-bold tracking-[-0.02em] text-navy">News &amp; documents</h1>
          <p className="mt-2 max-w-2xl text-body">
            Announcements, forms and guides from your faculty. Read these before you apply for co-op or an internship.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {pinned.length > 0 && (
          <section aria-labelledby="pinned-title">
            <h2 id="pinned-title" className="text-xl font-bold text-navy">
              Read these first
            </h2>
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {pinned.map((r) => {
                const Icon = KIND_ICON[r.kind];
                const t = splitTitle(r.title);
                return (
                  <li key={r.id} className="panel flex flex-col gap-3 p-5">
                    <span className="flex items-center gap-2 text-sm font-semibold text-navy">
                      <Icon className="size-4" aria-hidden /> {KIND_INFO[r.kind].label}
                    </span>
                    <div>
                      <h3 className="text-lg leading-snug font-bold text-navy">{t.main}</h3>
                      {t.sub && (
                        <p className="mt-0.5 text-sm text-muted" lang="th">
                          {t.sub}
                        </p>
                      )}
                      {r.summary && <p className="mt-2 text-body">{r.summary}</p>}
                    </div>
                    <div className="mt-auto pt-1">
                      <ResourceAction r={r} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section aria-labelledby="all-title" className="mt-12">
          <h2 id="all-title" className="text-xl font-bold text-navy">
            All news and documents
          </h2>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div role="group" aria-label="Type" className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-rule [scrollbar-width:none]">
              {(["all", ...RESOURCE_KINDS] as const).map((k) => {
                const n = k === "all" ? all.length : all.filter((r) => r.kind === k).length;
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={kind === k}
                    onClick={() => setKind(k)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
                      kind === k ? "bg-navy text-white" : "text-body hover:bg-navy-50"
                    }`}
                  >
                    {k === "all" ? "All" : KIND_INFO[k].plural}
                    <span className={`tabular text-xs ${kind === k ? "text-navy-100" : "text-muted"}`}>{list ? n : ""}</span>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <label>
                <span className="sr-only">Program</span>
                <select value={program} onChange={(e) => setProgram(e.target.value as Program | "all")} className="field h-10 text-sm sm:w-52">
                  <option value="all">Co-op &amp; internship</option>
                  <option value="coop">Co-op</option>
                  <option value="internship">Internship</option>
                </select>
              </label>
              <label>
                <span className="sr-only">Faculty</span>
                <select value={faculty} onChange={(e) => setFaculty(e.target.value)} className="field h-10 text-sm sm:w-52">
                  <option value="all">All faculties</option>
                  {FACULTIES.map((f) => (
                    <option key={f} value={f}>
                      {FACULTY_INFO[f].code} · {FACULTY_INFO[f].short}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="relative lg:ml-auto lg:w-72">
              <span className="sr-only">Search</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="field h-10 pl-9 text-sm" />
            </label>
          </div>

          <div className="panel mt-4 overflow-hidden">
            {error && !list ? (
              <p role="alert" className="p-6 text-danger">
                {error}
              </p>
            ) : list === null ? (
              <div className="space-y-2 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-lg bg-navy-50" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <Inbox className="mx-auto size-8 text-navy-200" aria-hidden />
                <p className="mt-3 font-semibold text-navy">Nothing here yet</p>
                <p className="mt-1 text-sm text-muted">Try another type or faculty.</p>
              </div>
            ) : (
              <ul className="divide-y divide-rule">
                {rows.map((r) => (
                  <ResourceRow key={r.id} r={r} />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
