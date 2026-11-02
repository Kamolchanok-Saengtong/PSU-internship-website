"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Copy,
  Download,
  ExternalLink,
  Info,
  LayoutList,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { deletePlaces, resetToSample, restorePlaces, savePlace, usePlaces } from "@/lib/store";
import { signOut, useSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { allowanceText, countdown, daysLeft, shortDate, statusOf } from "@/lib/status";
import { TYPE_INFO, monthlyPay, placeLocation } from "@/lib/placement";
import { PLACEMENT_TYPES, PROVINCES, type Place } from "@/lib/types";
import { PlaceDrawer } from "./place-form";
import { TypeTag } from "./position-row";
import { StatusBadge } from "./status-badge";

type StatusFilter = "all" | "open" | "closing" | "closed";
type SortKey = "deadline" | "role" | "pay" | "province";
type Toast = { id: number; text: string; undo?: () => void };
type Drawer = { title: string; initial?: Place } | null;

const PAGE_SIZE = 10;

/** "closing" means the deadline is within the next 7 days, matching the overview card. */
const matchesStatus = (p: Place, f: StatusFilter) => {
  if (f === "all") return true;
  const s = statusOf(p);
  if (f === "closed") return s === "closed";
  if (f === "open") return s !== "closed";
  const d = daysLeft(p.closes);
  return d >= 0 && d <= 7;
};

export function AdminPanel() {
  const places = usePlaces();
  const session = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState("all");
  const [province, setProvince] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "deadline", dir: 1 });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);

  // Reset paging and selection whenever the filters change.
  useEffect(() => {
    setPage(0);
    setSelected(new Set());
  }, [query, status, type, province]);

  const all = useMemo(() => places ?? [], [places]);
  const stats = useMemo(() => {
    const st = all.map((p) => statusOf(p));
    return {
      total: all.length,
      open: st.filter((s) => s !== "closed").length,
      week: all.filter((p) => {
        const d = daysLeft(p.closes);
        return d >= 0 && d <= 7;
      }).length,
      closed: st.filter((s) => s === "closed").length,
    };
  }, [all]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((p) => {
        if (!matchesStatus(p, status)) return false;
        if (type !== "all" && p.placementType !== type) return false;
        if (province !== "all" && p.province !== province) return false;
        if (q && !`${p.role} ${p.company} ${p.area} ${p.province} ${p.contactEmail}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        const d =
          sort.key === "role"
            ? a.role.localeCompare(b.role)
            : sort.key === "pay"
              ? monthlyPay(a) - monthlyPay(b)
              : sort.key === "province"
                ? a.province.localeCompare(b.province)
                : a.closes.localeCompare(b.closes);
        return d * sort.dir;
      });
  }, [all, query, status, type, province, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const filtered = query !== "" || status !== "all" || type !== "all" || province !== "all";

  function toast(text: string, undo?: () => void) {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, undo }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }

  function remove(ids: string[]) {
    const before = deletePlaces(ids);
    setSelected(new Set());
    toast(ids.length === 1 ? "Place deleted." : `${ids.length} places deleted.`, () => restorePlaces(before));
  }

  function save(place: Place) {
    const isNew = !all.some((p) => p.id === place.id);
    savePlace(place);
    setDrawer(null);
    toast(isNew ? `Added “${place.role}”.` : `Saved “${place.role}”.`);
  }

  function exportCsv() {
    const cols: [string, (p: Place) => string | number][] = [
      ["Role", (p) => p.role],
      ["Company", (p) => p.company],
      ["Type", (p) => p.placementType],
      ["Province", (p) => p.province],
      ["District", (p) => p.area],
      ["Work mode", (p) => p.workMode],
      ["Applications close", (p) => p.closes],
      ["Starts", (p) => p.starts],
      ["Ends", (p) => p.ends],
      ["Pay (THB)", (p) => p.allowance],
      ["Pay per", (p) => p.payPer],
      ["Seats", (p) => p.seats],
      ["Faculties", (p) => p.faculties.join("; ")],
      ["Benefits", (p) => (p.benefits ?? []).join("; ")],
      ["Documents", (p) => (p.documents ?? []).join("; ")],
      ["Contact", (p) => p.contactName],
      ["Email", (p) => p.contactEmail],
      ["Status", (p) => statusOf(p)],
    ];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [cols.map(([h]) => esc(h)).join(","), ...rows.map((p) => cols.map(([, f]) => esc(f(p))).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `psu-phuket-places-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${rows.length} ${rows.length === 1 ? "place" : "places"} to CSV.`);
  }

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  const allOnPage = pageRows.length > 0 && pageRows.every((p) => selected.has(p.id));
  const someOnPage = pageRows.some((p) => selected.has(p.id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of pageRows) {
        if (allOnPage) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <section className="hero-band">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 pt-10 pb-8 sm:px-6 sm:pt-12">
          <div>
            <h1 className="text-[clamp(1.9rem,4vw,2.5rem)] leading-tight font-bold tracking-[-0.02em] text-navy">
              Manage places
            </h1>
            <p className="mt-1 text-body">Add, update and remove the places students see on the board.</p>
            {session && (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
                <span className="grid size-7 place-items-center rounded-full bg-navy text-xs font-bold text-white uppercase">
                  {session.name.slice(0, 1)}
                </span>
                Signed in as <span className="font-semibold text-ink">{session.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    router.replace("/login");
                  }}
                  className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-navy-600 hover:bg-white"
                >
                  <LogOut className="size-3.5" aria-hidden /> Sign out
                </button>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportCsv} className="btn-secondary h-11 text-sm" disabled={!rows.length}>
              <Download className="size-4" aria-hidden /> Export CSV
            </button>
            <button type="button" onClick={() => setDrawer({ title: "Add a place" })} className="btn-primary h-11 text-sm">
              <Plus className="size-4" aria-hidden /> Add place
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="flex items-start gap-2.5 rounded-xl border border-gold/60 bg-gold-soft/60 px-4 py-3 text-sm text-gold-ink">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <strong>Draft mode.</strong> There is no staff sign-in yet, and changes are saved only in this browser. Connect a
            database and sign-in before going live.
          </span>
        </p>

        {/* Overview */}
        <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {(
            [
              { key: "all", label: "All places", value: stats.total, icon: LayoutList, tone: "text-navy bg-navy-50" },
              { key: "open", label: "Open", value: stats.open, icon: CircleCheck, tone: "text-success bg-[#e3f4ec]" },
              { key: "closing", label: "Closing in 7 days", value: stats.week, icon: CalendarClock, tone: "text-gold-ink bg-gold-soft" },
              { key: "closed", label: "Closed", value: stats.closed, icon: CircleX, tone: "text-[#5f6678] bg-[#eceef3]" },
            ] as const
          ).map(({ key, label, value, icon: Icon, tone }) => (
            <li key={key}>
              <button
                type="button"
                aria-pressed={status === key}
                onClick={() => setStatus(key)}
                className={`panel flex w-full items-center gap-4 p-4 text-left transition-[border-color,box-shadow] hover:border-navy-200 ${
                  status === key ? "border-navy shadow-[0_0_0_1px_var(--color-navy)]" : ""
                }`}
              >
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="tabular block text-2xl leading-none font-bold text-navy">{places ? value : "–"}</span>
                  <span className="mt-1 block text-sm text-muted">{label}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Table panel */}
        <section aria-labelledby="table-title" className="panel mt-6 overflow-hidden">
          <h2 id="table-title" className="sr-only">
            Places
          </h2>

          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-rule p-4 lg:flex-row lg:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Search places</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search role, company, place or email"
                className="field h-10 pl-9 text-sm"
              />
            </label>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <label>
                <span className="sr-only">Type</span>
                <select value={type} onChange={(e) => setType(e.target.value)} className="field h-10 text-sm sm:w-40">
                  <option value="all">All types</option>
                  {PLACEMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_INFO[t].short}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Province</span>
                <select value={province} onChange={(e) => setProvince(e.target.value)} className="field h-10 text-sm sm:w-44">
                  <option value="all">All provinces</option>
                  {PROVINCES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
            </div>
            {filtered && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setType("all");
                  setProvince("all");
                }}
                className="inline-flex h-10 items-center gap-1.5 self-start rounded-lg px-3 text-sm font-semibold text-navy-600 hover:bg-navy-50 lg:self-auto"
              >
                <X className="size-4" aria-hidden /> Clear
              </button>
            )}
          </div>

          {/* Bulk bar */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-b border-rule bg-navy-50 px-4 py-2.5 text-sm" role="status">
              <span className="font-semibold text-navy">{selected.size} selected</span>
              <button
                type="button"
                onClick={() => remove([...selected])}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold text-danger hover:bg-white"
              >
                <Trash2 className="size-4" aria-hidden /> Delete
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="ml-auto rounded-lg px-2.5 py-1.5 font-medium text-muted hover:bg-white hover:text-navy"
              >
                Clear selection
              </button>
            </div>
          )}

          {places === null ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-navy-50" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-lg font-semibold text-navy">{all.length ? "No places match" : "No places yet"}</p>
              <p className="mt-1 text-muted">
                {all.length ? "Try another search or filter." : "Add the first place students will see on the board."}
              </p>
              {!all.length && (
                <button type="button" onClick={() => setDrawer({ title: "Add a place" })} className="btn-primary mt-5 text-sm">
                  <Plus className="size-4" aria-hidden /> Add place
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#fafbfd] text-xs font-semibold tracking-wide text-muted uppercase">
                    <tr className="border-b border-rule">
                      <th className="w-12 py-3 pl-4">
                        <HeaderCheckbox checked={allOnPage} indeterminate={!allOnPage && someOnPage} onChange={toggleAll} />
                      </th>
                      <SortTh label="Place" k="role" sort={sort} onSort={toggleSort} />
                      <SortTh label="Location" k="province" sort={sort} onSort={toggleSort} />
                      <SortTh label="Deadline" k="deadline" sort={sort} onSort={toggleSort} />
                      <SortTh label="Pay" k="pay" sort={sort} onSort={toggleSort} align="right" />
                      <th className="px-3 py-3 text-right">Seats</th>
                      <th className="w-28 py-3 pr-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((p) => {
                      const st = statusOf(p);
                      const on = selected.has(p.id);
                      return (
                        <tr key={p.id} className={`border-b border-rule last:border-b-0 ${on ? "bg-navy-50/70" : "hover:bg-[#fafbfd]"}`}>
                          <td className="py-3 pl-4">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggleOne(p.id)}
                              aria-label={`Select ${p.role}`}
                              className="size-4"
                            />
                          </td>
                          <td className="max-w-[20rem] px-3 py-3">
                            <button
                              type="button"
                              onClick={() => setDrawer({ title: `Edit: ${p.role}`, initial: p })}
                              className="block max-w-full truncate text-left font-semibold text-navy hover:underline"
                            >
                              {p.role}
                            </button>
                            <span className="mt-0.5 flex items-center gap-2 text-muted">
                              <TypeTag type={p.placementType} />
                              <span className="truncate">{p.company}</span>
                            </span>
                          </td>
                          <td className="px-3 py-3 text-body">
                            {p.province}
                            <span className="block text-muted">{p.area}</span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="tabular font-medium text-ink">{shortDate(p.closes)}</span>
                            <span className="mt-1 flex items-center gap-2">
                              <StatusBadge status={st} />
                              {st !== "closed" && <span className="text-xs text-muted">{countdown(p.closes)}</span>}
                            </span>
                          </td>
                          <td className="tabular px-3 py-3 text-right whitespace-nowrap text-ink">{allowanceText(p.allowance, p.payPer)}</td>
                          <td className="tabular px-3 py-3 text-right text-ink">{p.seats}</td>
                          <td className="py-3 pr-4">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setDrawer({ title: `Edit: ${p.role}`, initial: p })}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-semibold text-navy hover:bg-navy-50"
                              >
                                <Pencil className="size-3.5" aria-hidden /> Edit
                              </button>
                              <RowMenu
                                place={p}
                                onDuplicate={() =>
                                  setDrawer({ title: "Duplicate place", initial: { ...p, id: "", role: `${p.role} (copy)` } })
                                }
                                onDelete={() => remove([p.id])}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phone list */}
              <ul className="divide-y divide-rule md:hidden">
                {pageRows.map((p) => {
                  const st = statusOf(p);
                  return (
                    <li key={p.id} className="flex gap-3 p-4">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleOne(p.id)}
                        aria-label={`Select ${p.role}`}
                        className="mt-1 size-4 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => setDrawer({ title: `Edit: ${p.role}`, initial: p })}
                          className="text-left font-semibold text-navy"
                        >
                          {p.role}
                        </button>
                        <p className="text-sm text-muted">
                          {p.company} · {placeLocation(p)}
                        </p>
                        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                          <TypeTag type={p.placementType} />
                          <StatusBadge status={st} />
                          <span className="tabular text-ink">{shortDate(p.closes)}</span>
                          <span className="tabular text-muted">{allowanceText(p.allowance, p.payPer)}</span>
                        </p>
                      </div>
                      <RowMenu
                        place={p}
                        onEdit={() => setDrawer({ title: `Edit: ${p.role}`, initial: p })}
                        onDuplicate={() => setDrawer({ title: "Duplicate place", initial: { ...p, id: "", role: `${p.role} (copy)` } })}
                        onDelete={() => remove([p.id])}
                      />
                    </li>
                  );
                })}
              </ul>

              {/* Footer: count and paging */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-3 text-sm text-muted">
                <span className="tabular">
                  Showing {page * PAGE_SIZE + 1}–{Math.min(rows.length, (page + 1) * PAGE_SIZE)} of {rows.length}
                </span>
                {pages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage((n) => Math.max(0, n - 1))}
                      disabled={page === 0}
                      className="grid size-9 place-items-center rounded-lg text-navy hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                      <span className="sr-only">Previous page</span>
                    </button>
                    <span className="tabular px-2 text-ink">
                      Page {page + 1} of {pages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((n) => Math.min(pages - 1, n + 1))}
                      disabled={page >= pages - 1}
                      className="grid size-9 place-items-center rounded-lg text-navy hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="size-4" aria-hidden />
                      <span className="sr-only">Next page</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          {confirmReset ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-danger/30 bg-[#fdf1f0] px-4 py-2.5" role="alert">
              <span className="text-ink">Replace every place with the original sample data?</span>
              <button
                type="button"
                onClick={() => {
                  restorePlacesBefore(all, (before) => toast("Sample data restored.", () => restorePlaces(before)));
                  setConfirmReset(false);
                }}
                className="btn-danger h-9 text-sm"
              >
                Reset
              </button>
              <button type="button" onClick={() => setConfirmReset(false)} className="btn-secondary h-9 text-sm">
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-semibold text-muted hover:text-navy"
            >
              <RotateCcw className="size-4" aria-hidden /> Reset to sample data
            </button>
          )}
        </div>
      </div>

      {drawer && (
        <PlaceDrawer
          key={drawer.initial?.id ?? drawer.title}
          title={drawer.title}
          initial={drawer.initial}
          existingIds={all.map((p) => p.id)}
          onSave={save}
          onClose={() => setDrawer(null)}
        />
      )}

      {/* Toasts */}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[70] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast pointer-events-auto flex items-center gap-3 rounded-xl bg-navy-950 px-4 py-3 text-sm text-white shadow-[0_18px_40px_-16px_rgb(15_27_56/0.7)]"
          >
            <CircleCheck className="size-4 shrink-0 text-gold" aria-hidden />
            <span className="flex-1">{t.text}</span>
            {t.undo && (
              <button
                type="button"
                onClick={() => {
                  t.undo?.();
                  setToasts((all) => all.filter((x) => x.id !== t.id));
                }}
                className="rounded-md px-2 py-1 font-semibold text-gold hover:bg-white/10"
              >
                Undo
              </button>
            )}
            <button
              type="button"
              onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
              className="grid size-6 place-items-center rounded-md text-navy-200 hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" aria-hidden />
              <span className="sr-only">Dismiss</span>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

/** Reset to sample data, handing back the previous list so it can be undone. */
function restorePlacesBefore(before: Place[], done: (before: Place[]) => void) {
  const snapshot = [...before];
  resetToSample();
  done(snapshot);
}

function SortTh({
  label,
  k,
  sort,
  onSort,
  align,
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (k: SortKey) => void;
  align?: "right";
}) {
  const active = sort.key === k;
  return (
    <th className={`px-3 py-3 ${align === "right" ? "text-right" : ""}`} aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1 rounded uppercase hover:text-navy ${active ? "text-navy" : ""}`}
      >
        {label}
        {active ? (
          sort.dir === 1 ? <ArrowUp className="size-3.5" aria-hidden /> : <ArrowDown className="size-3.5" aria-hidden />
        ) : (
          <ArrowUp className="size-3.5 opacity-0" aria-hidden />
        )}
      </button>
    </th>
  );
}

function HeaderCheckbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label="Select all on this page" className="size-4" />;
}

/** "More" menu for a row: view, duplicate, delete (and edit on phones). */
function RowMenu({
  place,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  place: Place;
  onEdit?: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-navy-50 focus:bg-navy-50 focus:outline-none";
  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid size-8 place-items-center rounded-lg text-muted hover:bg-navy-50 hover:text-navy"
      >
        <MoreHorizontal className="size-4" aria-hidden />
        <span className="sr-only">More actions for {place.role}</span>
      </button>
      {open && (
        <div role="menu" className="menu-pop absolute top-full right-0 z-20 mt-1 w-48 rounded-xl border border-rule bg-white p-1.5 shadow-[0_18px_40px_-16px_rgb(15_27_56/0.45)]">
          {onEdit && (
            <button type="button" role="menuitem" onClick={run(onEdit)} className={`${item} text-ink`}>
              <Pencil className="size-4 text-muted" aria-hidden /> Edit
            </button>
          )}
          <Link href={`/places/${place.id}`} role="menuitem" className={`${item} text-ink`} onClick={() => setOpen(false)}>
            <ExternalLink className="size-4 text-muted" aria-hidden /> View student page
          </Link>
          <button type="button" role="menuitem" onClick={run(onDuplicate)} className={`${item} text-ink`}>
            <Copy className="size-4 text-muted" aria-hidden /> Duplicate
          </button>
          <div className="my-1 h-px bg-rule" />
          <button type="button" role="menuitem" onClick={run(onDelete)} className={`${item} text-danger`}>
            <Trash2 className="size-4" aria-hidden /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
