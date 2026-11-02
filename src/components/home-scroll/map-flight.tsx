"use client";

import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { ArrowRight, MapPin } from "lucide-react";
import { CAMPUS, PROVINCE_COORDS } from "@/lib/geo";
import { TYPE_INFO, placeLocation } from "@/lib/placement";
import { allowanceText, statusOf } from "@/lib/status";
import { type Place, type Province } from "@/lib/types";
import { useWide } from "./motion-bits";

/** Order the route flies in: up the Andaman coast, across the south, then north. */
const ROUTE: Province[] = [
  "Phuket",
  "Phang Nga",
  "Krabi",
  "Surat Thani",
  "Songkhla",
  "Chonburi",
  "Samut Prakan",
  "Bangkok",
  "Khon Kaen",
  "Chiang Mai",
];

type Stop = { province: Province; places: Place[] };

/** Points along a gentle arc between two coordinates. */
function arc(a: [number, number], b: [number, number], steps = 24): [number, number][] {
  const [ax, ay] = a;
  const [bx, by] = b;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const bend = 0.18;
  const cx = mx - dy * bend;
  const cy = my + dx * bend;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return [u * u * ax + 2 * u * t * cx + t * t * bx, u * u * ay + 2 * u * t * cy + t * t * by];
  });
}

/**
 * A pinned map: as you scroll, a gold route draws from PSU Phuket Campus to each
 * province with open places, and the panel beside it shows that stop.
 */
export function MapFlight({ places }: { places: Place[] }) {
  const reduce = useReducedMotion();
  const wide = useWide("(min-width: 1024px)");
  const stops: Stop[] = useMemo(() => {
    const open = places.filter((p) => statusOf(p) !== "closed");
    return ROUTE.map((province) => ({
      province,
      places: open.filter((p) => p.province === province).sort((a, b) => a.closes.localeCompare(b.closes)),
    })).filter((s) => s.places.length > 0);
  }, [places]);

  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const progressRef = useRef(0);
  const drawRef = useRef<(p: number) => void>(() => {});

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const p = Math.min(1, Math.max(0, (v - 0.02) / 0.94));
    progressRef.current = p;
    drawRef.current(p);
    const i = Math.min(stops.length - 1, Math.floor(p * stops.length + 0.0001));
    setActive((prev) => (prev === i ? prev : i));
  });

  const pinned = !reduce;
  const stop = stops[active];

  return (
    <section
      ref={sectionRef}
      aria-labelledby="flight-title"
      className="relative mt-24"
      style={{ height: pinned ? `${100 + stops.length * (wide ? 24 : 20)}vh` : undefined }}
    >
      <div
        className={`${pinned ? "sticky top-[4.5rem] h-[calc(100svh-4.5rem)] overflow-hidden" : ""} mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:grid lg:grid-cols-[22rem_1fr] lg:items-center lg:gap-10 lg:py-6`}
      >
        <div className="order-2 shrink-0 lg:order-1">
          <h2 id="flight-title" className="text-[clamp(1.45rem,3.2vw,2.4rem)] leading-tight font-bold tracking-[-0.02em] text-navy">
            From Phuket to all of Thailand
          </h2>
          <p className="mt-1 text-sm text-body sm:mt-2 sm:text-base">
            Places in {stops.length} provinces. Scroll to follow the route from campus.
          </p>

          {stop && (
            <div className="relative mt-3 sm:mt-6 lg:min-h-[15rem]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={stop.province}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="panel p-5"
                >
                  <p className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-lg font-bold text-navy">
                      <MapPin className="size-5 text-gold-ink" aria-hidden /> {stop.province}
                    </span>
                    <span className="tabular rounded-full bg-navy px-2.5 py-0.5 text-sm font-semibold text-white">
                      {active + 1}/{stops.length}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {stop.places.length} open {stop.places.length === 1 ? "place" : "places"}
                  </p>
                  <ul className="mt-3 divide-y divide-rule">
                    {stop.places.slice(0, 2).map((p, i) => (
                      <li key={p.id} className={`py-2.5 ${i > 0 ? "hidden sm:block" : ""}`}>
                        <Link href={`/places/${p.id}`} className="font-semibold text-navy hover:underline">
                          {p.role}
                        </Link>
                        <span className="block text-sm text-muted">
                          {TYPE_INFO[p.placementType].short} · {placeLocation(p)} · {allowanceText(p.allowance, p.payPer)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/positions?province=${encodeURIComponent(stop.province)}`}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-navy-600"
                  >
                    All places in {stop.province} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>

        <FlightMap stops={stops} active={active} drawRef={drawRef} progressRef={progressRef} />
      </div>
    </section>
  );
}

function FlightMap({
  stops,
  active,
  drawRef,
  progressRef,
}: {
  stops: Stop[];
  active: number;
  drawRef: React.RefObject<(p: number) => void>;
  progressRef: React.RefObject<number>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || stops.length === 0) return;
    let map: import("leaflet").Map | undefined;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;

      map = L.map(host, {
        zoomControl: false,
        attributionControl: true,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const coords = stops.map((s) => PROVINCE_COORDS[s.province]);
      map.fitBounds(L.latLngBounds([CAMPUS, ...coords]), { padding: [36, 36] });

      // The route: campus → each stop, as one gently curving line.
      const points: [number, number][] = [CAMPUS];
      const stopAt: number[] = [];
      let prev = CAMPUS;
      for (const c of coords) {
        const seg = arc(prev, c);
        points.push(...seg.slice(1));
        stopAt.push(points.length - 1);
        prev = c;
      }
      L.polyline(points, { color: "#c3cce0", weight: 2, dashArray: "4 6", interactive: false }).addTo(map);
      const route = L.polyline(points, { color: "#d4ac0d", weight: 4, lineCap: "round", interactive: false }).addTo(map);

      L.marker(CAMPUS, {
        icon: L.divIcon({ className: "", html: `<span class="map-campus"><img src="/psu-emblem.svg" alt="" /></span>`, iconSize: [40, 40], iconAnchor: [20, 20] }),
        interactive: false,
        zIndexOffset: 500,
      }).addTo(map);

      markersRef.current = stops.map((s, i) => {
        const m = L.marker(coords[i], {
          icon: L.divIcon({ className: "", html: `<span class="flight-stop">${s.places.length}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }),
          interactive: false,
        }).addTo(map!);
        return m.getElement()!.firstElementChild as HTMLElement;
      });

      const path = route.getElement() as SVGPathElement | undefined;
      let total = path?.getTotalLength() ?? 0;
      const draw = (p: number) => {
        if (!path) return;
        // Arrive at stop i exactly when progress reaches (i + 1) / n.
        const target = Math.min(stops.length, p * stops.length);
        const i = Math.floor(target);
        const from = i === 0 ? 0 : stopAt[i - 1];
        const to = stopAt[Math.min(i, stops.length - 1)];
        const idx = i >= stops.length ? points.length - 1 : from + (to - from) * (target - i);
        const len = total * (idx / (points.length - 1));
        path.style.strokeDasharray = `${total}`;
        path.style.strokeDashoffset = `${total - len}`;
        markersRef.current.forEach((el, k) => el.classList.toggle("is-reached", k < target - 0.02 || k === 0));
      };
      drawRef.current = draw;
      draw(progressRef.current);
      map.on("zoomend resize", () => {
        total = path?.getTotalLength() ?? 0;
        draw(progressRef.current);
      });
    })();

    return () => {
      cancelled = true;
      drawRef.current = () => {};
      map?.remove();
    };
  }, [stops, drawRef, progressRef]);

  useEffect(() => {
    markersRef.current.forEach((el, i) => el.classList.toggle("is-current", i === active));
  }, [active]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label="Map of Thailand with a route from PSU Phuket Campus to each province with open places"
      className="order-1 min-h-[9rem] w-full flex-1 overflow-hidden rounded-2xl border border-rule bg-[#aad3df] lg:order-2 lg:h-[min(40rem,calc(100vh-8rem))] lg:flex-none"
    />
  );
}
