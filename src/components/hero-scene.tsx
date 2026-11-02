"use client";

import Image from "next/image";
import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { BellRing, GraduationCap, MapPin, Sparkles, Wallet } from "lucide-react";
import { FACULTY_INFO } from "@/lib/faculties";
import { allowanceText, countdown, statusOf } from "@/lib/status";
import { FACULTIES, PROVINCES, type Place } from "@/lib/types";
import { DateBlock } from "./position-row";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * The welcome illustration: the PSU emblem with live pieces of the board floating around it.
 * Pieces spring in one by one, bob gently, and drift at different depths with the pointer.
 */
export function HeroScene({ places }: { places: Place[] | null }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  // Soft, well-damped springs: the scene glides after the pointer instead of snapping to it.
  const sx = useSpring(mx, { stiffness: 45, damping: 22, mass: 0.9 });
  const sy = useSpring(my, { stiffness: 45, damping: 22, mass: 0.9 });

  // Follow the pointer anywhere in the window, not just over the scene.
  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my, reduce]);

  const open = (places ?? []).filter((p) => statusOf(p) !== "closed").sort((a, b) => a.closes.localeCompare(b.closes));
  const next = open[0];
  const best = open.filter((p) => p.payPer === "month").sort((a, b) => b.allowance - a.allowance)[0];
  const busiest = PROVINCES.map((a) => ({ a, n: open.filter((p) => p.province === a).length })).sort((x, y) => y.n - x.n)[0];
  const provinces = new Set(open.map((p) => p.province)).size;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[34rem]" aria-hidden>
      {/* Soft light that slowly breathes behind everything */}
      <div className="hero-breathe absolute inset-[8%] rounded-full bg-[radial-gradient(circle_at_40%_35%,#ffffff_0%,#dbe6f6_45%,transparent_70%)]" />
      <div className="hero-drift absolute top-[12%] right-[10%] size-40 rounded-full bg-gold-soft blur-3xl" />

      {/* Orbit rings */}
      <Layer depth={6} sx={sx} sy={sy} className="absolute inset-[14%]">
        <svg viewBox="0 0 100 100" className="hero-spin size-full text-navy-200">
          <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" strokeWidth="0.35" strokeDasharray="1.5 2.5" />
          <circle cx="50" cy="1" r="1.2" className="fill-gold" />
          <circle cx="99" cy="50" r="0.9" className="fill-navy-600" />
        </svg>
      </Layer>
      <Layer depth={10} sx={sx} sy={sy} className="absolute inset-[27%]">
        <svg viewBox="0 0 100 100" className="hero-spin-back size-full text-navy-100">
          <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" strokeWidth="0.8" />
        </svg>
      </Layer>

      {/* Emblem */}
      <Layer depth={14} sx={sx} sy={sy} className="absolute inset-[33%] grid place-items-center sm:inset-[31%]">
        <Piece delay={0.1} bob={7} reduce={reduce} className="grid aspect-square w-full place-items-center rounded-full bg-white shadow-[0_30px_60px_-25px_rgb(32_54_105/0.55)] ring-8 ring-white/60">
          <Image src="/psu-emblem.svg" alt="" width={120} height={157} priority className="h-auto w-[50%]" />
        </Piece>
      </Layer>

      {/* Next deadline */}
      {next && (
        <Layer depth={34} sx={sx} sy={sy} className="absolute top-[2%] left-0 w-[72%] sm:top-[4%] sm:w-[52%]">
          <Piece delay={0.35} bob={9} reduce={reduce} className="hero-card flex items-center gap-3 p-3">
            <DateBlock iso={next.closes} status={statusOf(next)} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-navy">{next.role}</span>
              <span className="block truncate text-xs text-muted">{next.company}</span>
              <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-gold-ink">
                <BellRing className="size-3" /> {countdown(next.closes)}
              </span>
            </span>
          </Piece>
        </Layer>
      )}

      {/* Calendar leaf */}
      {next && (
        <Layer depth={22} sx={sx} sy={sy} className="absolute top-[8%] right-[2%] hidden w-[30%] sm:block">
          <Piece delay={0.5} bob={6} reduce={reduce} className="hero-card p-3">
            <MiniCalendar iso={next.closes} />
          </Piece>
        </Layer>
      )}

      {/* Graduation cap bubble */}
      <Layer depth={44} sx={sx} sy={sy} className="absolute top-[36%] left-[3%] hidden sm:block">
        <Piece delay={0.65} bob={11} reduce={reduce} className="grid size-14 place-items-center rounded-2xl bg-navy text-white shadow-[0_18px_30px_-14px_rgb(32_54_105/0.8)]">
          <GraduationCap className="size-7" />
        </Piece>
      </Layer>

      {/* Busiest area */}
      {busiest && busiest.n > 0 && (
        <Layer depth={30} sx={sx} sy={sy} className="absolute top-[47%] right-0 hidden sm:block">
          <Piece delay={0.8} bob={8} reduce={reduce} className="hero-card flex items-center gap-2.5 py-2.5 pr-4 pl-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-navy-50 text-navy">
              <MapPin className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-navy">
                {provinces} provinces
              </span>
              <span className="block text-xs text-muted">
                Most in {busiest.a} · {busiest.n} open
              </span>
            </span>
          </Piece>
        </Layer>
      )}

      {/* Best allowance */}
      {best && best.allowance > 0 && (
        <Layer depth={38} sx={sx} sy={sy} className="absolute bottom-[16%] left-0 sm:bottom-[10%] sm:left-[2%]">
          <Piece delay={0.95} bob={10} reduce={reduce} className="hero-card flex items-center gap-2.5 py-2.5 pr-4 pl-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-[#e3f4ec] text-success">
              <Wallet className="size-5" />
            </span>
            <span>
              <span className="tabular block text-sm font-bold text-ink">{allowanceText(best.allowance, best.payPer)}</span>
              <span className="block text-xs text-muted">Best allowance right now</span>
            </span>
          </Piece>
        </Layer>
      )}

      {/* Faculties */}
      <Layer depth={26} sx={sx} sy={sy} className="absolute right-0 bottom-0 sm:right-[4%] sm:bottom-[3%]">
        <Piece delay={1.1} bob={7} reduce={reduce} className="hero-card px-3 py-2.5">
          <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-muted">
            <Sparkles className="size-3 text-gold-ink" /> Four faculties
          </span>
          <span className="flex gap-1.5">
            {FACULTIES.map((f) => (
              <span key={f} className="rounded-md bg-navy px-2 py-1 text-xs font-bold text-white">
                {FACULTY_INFO[f].code}
              </span>
            ))}
          </span>
        </Piece>
      </Layer>

      {/* Small accents */}
      <Layer depth={50} sx={sx} sy={sy} className="absolute top-[24%] left-[30%] hidden sm:block">
        <Piece delay={1.2} bob={5} reduce={reduce} className="size-3 rounded-full bg-gold shadow-[0_0_0_6px_rgb(237_205_0/0.18)]" />
      </Layer>
      <Layer depth={18} sx={sx} sy={sy} className="absolute bottom-[30%] left-[30%] hidden sm:block">
        <Piece delay={1.25} bob={4} reduce={reduce} className="size-2 rounded-full bg-navy-600" />
      </Layer>
    </div>
  );
}

/** Moves its children with the pointer; deeper layers move further, which reads as depth. */
function Layer({
  depth,
  sx,
  sy,
  className,
  children,
}: {
  depth: number;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  className?: string;
  children: React.ReactNode;
}) {
  const x = useTransform(sx, (v) => v * depth);
  const y = useTransform(sy, (v) => v * depth);
  return (
    <motion.div style={{ x, y, willChange: "transform" }} className={className}>
      {children}
    </motion.div>
  );
}

/** Springs in after `delay`, then bobs up and down forever. */
function Piece({
  delay,
  bob,
  reduce,
  className,
  children,
}: {
  delay: number;
  bob: number;
  reduce: boolean | null;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.6, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 20, mass: 0.9, delay }}
      className="size-full"
    >
      {/* The bob is plain CSS: Motion 14.3's repeating keyframes stopped these layers from painting in Chrome. */}
      <div
        className={`${reduce ? "" : "hero-bob"} ${className ?? ""}`}
        style={{ "--bob": `${-bob}px`, "--bob-dur": `${4 + bob / 3}s`, "--bob-delay": `${delay + 0.6}s` } as React.CSSProperties}
      >
        {children}
      </div>
    </motion.div>
  );
}

function MiniCalendar({ iso }: { iso: string }) {
  const [y, m, d] = iso.split("-").map(Number);
  const first = new Date(y, m - 1, 1).getDay(); // 0 = Sunday
  const days = new Date(y, m, 0).getDate();
  const cells = [...Array.from({ length: first }, () => 0), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <span className="block">
      <span className="block text-xs font-semibold text-navy">
        {MONTHS[m - 1]} {y}
      </span>
      <span className="mt-1.5 grid grid-cols-7 gap-[3px]">
        {cells.map((n, i) => (
          <span
            key={i}
            className={`tabular grid aspect-square place-items-center rounded-[4px] text-[0.5rem] leading-none ${
              n === 0 ? "" : n === d ? "bg-gold font-bold text-navy-950" : "bg-navy-50 text-muted"
            }`}
          >
            {n || ""}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Text side of the welcome band, revealed in sequence. */
export function HeroCopy({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } }}
    >
      {children}
    </motion.div>
  );
}

export function HeroLine({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

