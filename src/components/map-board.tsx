"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Globe2, List, Map as MapIcon, MapPin, Wifi, X } from "lucide-react";
import { FACULTY_INFO } from "@/lib/faculties";
import { CAMPUS, VIEWS, distanceKm, placeCoords } from "@/lib/geo";
import { TYPE_INFO, placeLocation } from "@/lib/placement";
import { allowanceText, countdown, statusOf } from "@/lib/status";
import { usePlaces } from "@/lib/store";
import { FACULTIES, PLACEMENT_TYPES, type Faculty, type Place, type PlacementType } from "@/lib/types";
import type { Bounds, MapPoint, ViewRequest } from "./explorer-map";
import { TypeTag } from "./position-row";
import { SaveButton } from "./save-button";
import { StatusBadge } from "./status-badge";

const ExplorerMap = dynamic(() => import("./explorer-map").then((m) => m.ExplorerMap), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-[#e8eef6]" />,
});

/** Short pay text for a map pin: ฿8k, ฿7.5k, ฿150/h, Unpaid. */
function pinLabel(p: Place) {
  if (p.allowance <= 0) return "Unpaid";
  if (p.payPer === "hour") return `฿${p.allowance}/h`;
  const k = p.allowance / 1000;
  return `฿${Number.isInteger(k) ? k : k.toFixed(1)}k`;
}

function distanceText(km: number) {
  if (km < 1) return "On campus";
  return km < 100 ? `${Math.round(km)} km from campus` : `${Math.round(km / 10) * 10} km away`;
}

type Item = { place: Place; coords: [number, number] | null; km: number | null };

export function MapBoard() {
  const places = usePlaces();
  const [type, setType] = useState<PlacementType | "all">("all");
  const [faculty, setFaculty] = useState<Faculty | "all">("all");
  const [showClosed, setShowClosed] = useState(false);
  const [inView, setInView] = useState(true);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ id: string; nonce: number } | null>(null);
  const [view, setView] = useState<ViewRequest | null>(null);
  const [tab, setTab] = useState<"list" | "map">("map");
  const listRef = useRef<HTMLDivElement>(null);

  const items: Item[] = useMemo(() => {
    if (!places) return [];
    return places
      .filter((p) => (showClosed || statusOf(p) !== "closed") && (type === "all" || p.placementType === type))
      .filter((p) => faculty === "all" || p.faculties.includes(faculty))
      .map((place) => {
        const coords = placeCoords(place);
        return { place, coords, km: coords ? distanceKm(CAMPUS, coords) : null };
      })
      .sort((a, b) => a.place.closes.localeCompare(b.place.closes));
  }, [places, type, faculty, showClosed]);

  const onMap = useMemo(() => items.filter((i) => i.coords), [items]);
  const remote = useMemo(() => items.filter((i) => !i.coords), [items]);
  const visible = useMemo(
    () =>
      inView && bounds
        ? onMap.filter(({ coords }) => {
            const [lat, lng] = coords!;
            return lat >= bounds.s && lat <= bounds.n && lng >= bounds.w && lng <= bounds.e;
          })
        : onMap,
    [onMap, inView, bounds],
  );

  const points: MapPoint[] = useMemo(
    () =>
      onMap.map(({ place: p, coords }) => ({
        id: p.id,
        coords: coords!,
        label: pinLabel(p),
        type: p.placementType,
        closed: statusOf(p) === "closed",
      })),
    [onMap],
  );

  const active = items.find((i) => i.place.id === activeId) ?? null;

  // Clear the selection if a filter hides it.
  useEffect(() => {
    if (activeId && !items.some((i) => i.place.id === activeId)) setActiveId(null);
  }, [items, activeId]);

  // When a pin is picked, bring its card into view in the list.
  useEffect(() => {
    if (!activeId) return;
    listRef.current?.querySelector(`[data-id="${CSS.escape(activeId)}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId]);

  const pick = (id: string) => {
    setActiveId(id);
    setFocus({ id, nonce: Date.now() });
    setTab("map");
  };

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-4.5rem)]">
      {/* Toolbar */}
      <div className="shrink-0 border-b border-rule bg-white">
        <div className="mx-auto flex max-w-[96rem] flex-col gap-2.5 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-baseline gap-3">
              <h1 className="text-xl font-bold whitespace-nowrap text-navy">Find on the map</h1>
              <p className="tabular text-sm whitespace-nowrap text-muted" aria-live="polite">
                {places === null ? "Loading…" : `${items.length} places`}
              </p>
            </div>
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
              <button type="button" onClick={() => setView({ fitAll: true, nonce: Date.now() })} className="jump-btn">
                <Globe2 className="size-3.5" aria-hidden /> All of Thailand
              </button>
              {(Object.keys(VIEWS) as (keyof typeof VIEWS)[]).map((k) => (
                <button key={k} type="button" onClick={() => setView({ ...VIEWS[k], nonce: Date.now() })} className="jump-btn">
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Type" className="-mx-4 flex max-w-[100vw] gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
              <div className="flex gap-1 rounded-xl bg-navy-50 p-1">
                {(["all", ...PLACEMENT_TYPES] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={type === t}
                    onClick={() => setType(t)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                      type === t ? "bg-white text-navy shadow-[0_1px_3px_rgb(15_27_56/0.15)]" : "text-body hover:text-navy"
                    }`}
                  >
                    {t !== "all" && (
                      <span
                        className={`size-2.5 rounded-full ${t === "Part-time" ? "bg-[#1d5fa8]" : t === "Co-op" ? "bg-navy" : "bg-[#5b3aa4]"}`}
                        aria-hidden
                      />
                    )}
                    {t === "all" ? "All types" : TYPE_INFO[t].short}
                  </button>
                ))}
              </div>
            </div>
            <label>
              <span className="sr-only">Faculty</span>
              <select value={faculty} onChange={(e) => setFaculty(e.target.value as Faculty | "all")} className="field h-9 w-auto text-sm">
                <option value="all">All faculties</option>
                {FACULTIES.map((f) => (
                  <option key={f} value={f}>
                    {FACULTY_INFO[f].code} · {FACULTY_INFO[f].short}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-body hover:bg-navy-50">
              <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} className="size-4" />
              Show closed
            </label>
          </div>
        </div>
      </div>

      {/* Phone: list / map switch */}
      <div className="flex shrink-0 gap-1 border-b border-rule bg-white p-2 lg:hidden" role="tablist" aria-label="View">
        {(
          [
            ["map", "Map", MapIcon],
            ["list", "List", List],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold ${
              tab === k ? "bg-navy text-white" : "text-body"
            }`}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(22rem,26rem)_1fr]">
        {/* List */}
        <div
          ref={listRef}
          data-lenis-prevent
          className={`min-h-0 overflow-y-auto overscroll-contain border-r border-rule bg-ground lg:block ${tab === "list" ? "block" : "hidden"}`}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-rule bg-ground/95 px-4 py-2.5 backdrop-blur">
            <p className="text-sm text-body">
              <span className="font-semibold text-ink">{visible.length}</span> {inView ? "in this area" : "on the map"}
            </p>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-body">
              <input type="checkbox" checked={inView} onChange={(e) => setInView(e.target.checked)} className="size-4" />
              Only show what&apos;s in view
            </label>
          </div>

          {places === null ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-white" />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5 p-3 sm:p-4">
              {visible.length === 0 && (
                <div className="rounded-xl border border-dashed border-navy-200 bg-white px-4 py-10 text-center">
                  <p className="font-semibold text-navy">No places in this part of the map</p>
                  <p className="mt-1 text-sm text-muted">Zoom out or move the map, or try another filter.</p>
                  <button type="button" onClick={() => setView({ fitAll: true, nonce: Date.now() })} className="btn-secondary mt-4 h-9 text-sm">
                    Show all of Thailand
                  </button>
                </div>
              )}
              {visible.map((i) => (
                <ListCard
                  key={i.place.id}
                  item={i}
                  active={i.place.id === activeId}
                  hover={i.place.id === hoverId}
                  onPick={() => pick(i.place.id)}
                  onHover={setHoverId}
                />
              ))}

              {remote.length > 0 && (
                <div className="pt-4">
                  <h2 className="flex items-center gap-2 px-1 text-sm font-semibold text-navy">
                    <Wifi className="size-4" aria-hidden /> Remote: work from anywhere
                  </h2>
                  <div className="mt-2 space-y-2.5">
                    {remote.map((i) => (
                      <ListCard key={i.place.id} item={i} active={false} hover={false} onHover={() => {}} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map */}
        <div className={`relative h-[70dvh] min-h-[420px] lg:block lg:h-auto ${tab === "map" ? "block" : "hidden"}`}>
          <ExplorerMap
            points={points}
            activeId={activeId}
            hoverId={hoverId}
            focus={focus}
            view={view}
            onSelect={setActiveId}
            onHover={setHoverId}
            onBounds={setBounds}
          />

          <div className="pointer-events-none absolute top-3 left-3 z-[500] flex flex-wrap gap-1.5 text-xs font-medium" aria-hidden>
            <span className="legend-chip"><span className="pin-dot pin-part" /> Part-time</span>
            <span className="legend-chip"><span className="pin-dot pin-short" /> Short-term</span>
            <span className="legend-chip"><span className="pin-dot pin-coop" /> Co-op</span>
          </div>

          {active && <MapCard item={active} onClose={() => setActiveId(null)} />}
        </div>
      </div>
    </div>
  );
}

function ListCard({
  item: { place: p, km },
  active,
  hover,
  onPick,
  onHover,
}: {
  item: Item;
  active: boolean;
  hover: boolean;
  onPick?: () => void;
  onHover: (id: string | null) => void;
}) {
  const status = statusOf(p);
  return (
    <article
      data-id={p.id}
      onMouseEnter={() => onHover(p.id)}
      onMouseLeave={() => onHover(null)}
      className={`relative rounded-xl border bg-white p-3.5 transition-[border-color,box-shadow] ${
        active
          ? "border-navy shadow-[0_0_0_1px_var(--color-navy),0_10px_24px_-16px_rgb(15_27_56/0.5)]"
          : hover
            ? "border-navy-200 shadow-[0_10px_24px_-18px_rgb(15_27_56/0.5)]"
            : "border-rule"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <TypeTag type={p.placementType} />
          <h3 className="mt-1 leading-snug font-semibold text-navy">
            {onPick ? (
              <button type="button" onClick={onPick} className="text-left after:absolute after:inset-0 after:rounded-xl hover:underline">
                {p.role}
              </button>
            ) : (
              <Link href={`/places/${p.id}`} className="after:absolute after:inset-0 after:rounded-xl hover:underline">
                {p.role}
              </Link>
            )}
          </h3>
          <p className="truncate text-sm text-body">{p.company}</p>
        </div>
        <SaveButton placeId={p.id} compact />
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" aria-hidden /> {placeLocation(p)}
        </span>
        {km !== null && <span>{distanceText(km)}</span>}
      </p>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm">
          <StatusBadge status={status} />
          {status !== "closed" && <span className="text-muted">{countdown(p.closes)}</span>}
        </span>
        <span className="tabular text-sm font-semibold text-ink">{allowanceText(p.allowance, p.payPer)}</span>
      </div>
    </article>
  );
}

function MapCard({ item: { place: p, km }, onClose }: { item: Item; onClose: () => void }) {
  const status = statusOf(p);
  return (
    <div className="map-card absolute inset-x-3 bottom-3 z-[600] mx-auto max-w-md rounded-2xl border border-rule bg-white p-4 shadow-[0_24px_50px_-20px_rgb(15_27_56/0.55)] sm:inset-x-auto sm:left-4 sm:mx-0 sm:w-[24rem]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeTag type={p.placementType} />
            <StatusBadge status={status} />
          </div>
          <h2 className="mt-1.5 text-lg leading-snug font-bold text-navy">{p.role}</h2>
          <p className="text-sm text-body">{p.company}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <SaveButton placeId={p.id} compact />
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-navy-50 hover:text-navy">
            <X className="size-4" aria-hidden />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-muted">Pay</dt>
          <dd className="tabular font-semibold text-ink">{allowanceText(p.allowance, p.payPer)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Deadline</dt>
          <dd className="font-semibold text-ink">{countdown(p.closes)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-muted">Where</dt>
          <dd className="text-ink">
            {placeLocation(p)} · {p.workMode}
            {km !== null && <span className="text-muted"> · {distanceText(km)}</span>}
          </dd>
        </div>
      </dl>
      <Link href={`/places/${p.id}`} className="btn-primary mt-4 h-10 w-full text-sm">
        View details <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
