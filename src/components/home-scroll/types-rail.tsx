"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Clock3, GraduationCap, MapPin } from "lucide-react";
import { TYPE_INFO, placeLocation } from "@/lib/placement";
import { allowanceText, countdown, statusOf } from "@/lib/status";
import { PLACEMENT_TYPES, type Place, type PlacementType } from "@/lib/types";
import { useWide } from "./motion-bits";

const ICONS = [Clock3, BriefcaseBusiness, GraduationCap];

/**
 * Placement types as a horizontal rail: on wide screens the section pins and
 * vertical scrolling slides the cards sideways. Phones get a plain stack.
 */
export function TypesRail({ places }: { places: Place[] }) {
  const reduce = useReducedMotion();
  const wide = useWide();
  const pinned = wide && !reduce;

  const open = places.filter((p) => statusOf(p) !== "closed").sort((a, b) => a.closes.localeCompare(b.closes));

  const panels = (
    <>
      <IntroPanel />
      {PLACEMENT_TYPES.map((t, i) => (
        <TypePanel key={t} type={t} index={i} places={open.filter((p) => p.placementType === t)} />
      ))}
    </>
  );

  if (!pinned) {
    return (
      <section aria-labelledby="types-title" className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4">{panels}</div>
      </section>
    );
  }
  return <PinnedRail>{panels}</PinnedRail>;
}

function PinnedRail({ children }: { children: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);

  // How far the track must travel so its last card ends at the right edge.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setDistance(Math.max(0, track.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0.02, 0.98], [0, -distance], { clamp: true });
  const bar = useTransform(scrollYProgress, [0.02, 0.98], [0, 1], { clamp: true });

  return (
    <section
      ref={sectionRef}
      aria-labelledby="types-title"
      className="relative mt-20"
      style={{ height: `calc(100vh + ${Math.round(distance * 0.55)}px)` }}
    >
      <div className="sticky top-[4.5rem] flex h-[calc(100vh-4.5rem)] flex-col justify-center overflow-hidden">
        <motion.div ref={trackRef} style={{ x }} className="flex w-max gap-5 px-[max(1rem,calc((100vw-72rem)/2+1.5rem))] will-change-transform">
          {children}
        </motion.div>
        <div className="mx-auto mt-8 h-1 w-48 overflow-hidden rounded-full bg-navy-100" aria-hidden>
          <motion.div style={{ scaleX: bar }} className="h-full origin-left rounded-full bg-navy" />
        </div>
      </div>
    </section>
  );
}

function IntroPanel() {
  return (
    <div className="flex w-full shrink-0 flex-col justify-center py-4 md:w-[22rem] md:pr-6">
      <h2 id="types-title" className="text-[clamp(1.9rem,3.5vw,2.6rem)] leading-tight font-bold tracking-[-0.02em] text-navy">
        Choose how you want to work
      </h2>
      <p className="mt-3 text-lg text-body">From a few hours a week to a full co-op semester.</p>
      <p className="mt-6 hidden items-center gap-2 text-sm font-semibold text-navy-600 md:flex">
        Keep scrolling <ArrowRight className="size-4" aria-hidden />
      </p>
    </div>
  );
}

function TypePanel({ type, index, places }: { type: PlacementType; index: number; places: Place[] }) {
  const info = TYPE_INFO[type];
  const Icon = ICONS[index];
  const dark = index === 2;
  return (
    <article
      className={`flex w-full shrink-0 flex-col rounded-[1.75rem] p-6 sm:p-8 md:h-[min(34rem,calc(100vh-11rem))] md:w-[min(44rem,78vw)] ${
        dark ? "bg-navy text-white" : "border border-rule bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`grid size-14 place-items-center rounded-2xl ${dark ? "bg-white/10 text-gold" : "bg-navy text-white"}`}>
          <Icon className="size-7" aria-hidden />
        </span>
        <span className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${dark ? "bg-white/10 text-white" : "bg-navy-50 text-navy"}`}>
          {places.length} open
        </span>
      </div>
      <h3 className={`mt-6 text-[clamp(1.6rem,3vw,2.2rem)] leading-tight font-bold ${dark ? "text-white" : "text-navy"}`}>
        {info.label}
      </h3>
      <p className={`mt-1 font-semibold ${dark ? "text-gold" : "text-gold-ink"}`}>{info.length}</p>
      <p className={`mt-3 max-w-lg leading-relaxed ${dark ? "text-navy-100" : "text-body"}`}>{info.text}</p>

      <ul className={`mt-6 divide-y ${dark ? "divide-white/10" : "divide-rule"}`}>
        {places.slice(0, 3).map((p) => (
          <li key={p.id}>
            <Link href={`/places/${p.id}`} className="group flex items-center justify-between gap-4 py-3">
              <span className="min-w-0">
                <span className={`block truncate font-semibold group-hover:underline ${dark ? "text-white" : "text-navy"}`}>
                  {p.role}
                </span>
                <span className={`flex items-center gap-1 truncate text-sm ${dark ? "text-navy-200" : "text-muted"}`}>
                  <MapPin className="size-3.5 shrink-0" aria-hidden /> {placeLocation(p)} · {countdown(p.closes)}
                </span>
              </span>
              <span className={`tabular shrink-0 text-sm font-semibold ${dark ? "text-white" : "text-ink"}`}>
                {allowanceText(p.allowance, p.payPer)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={`/positions?type=${info.slug}`}
        className={`mt-auto inline-flex items-center gap-1.5 pt-6 font-semibold ${dark ? "text-gold" : "text-navy-600"}`}
      >
        See all {info.short.toLowerCase()} places <ArrowRight className="size-4" aria-hidden />
      </Link>
    </article>
  );
}
