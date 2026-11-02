"use client";

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { BellRing, CalendarPlus, Check, Mail, Paperclip, Search } from "lucide-react";
import { TYPE_INFO, placeLocation } from "@/lib/placement";
import { allowanceText, longDate, statusOf } from "@/lib/status";
import type { Place } from "@/lib/types";
import { DateBlock } from "../position-row";
import { useStepSnap } from "./use-step-snap";

const STEPS = [
  { title: "Find a place", text: "Filter by type, faculty and province, or search by keyword." },
  { title: "Check who can apply", text: "Read the duties and requirements on the place page." },
  { title: "Set a reminder", text: "Add the deadline to Google Calendar so you don't miss it." },
  { title: "Apply before the deadline", text: "Email the contact with the documents the place asks for." },
];

/**
 * "How to apply" as a pinned story: scrolling moves through the four steps,
 * and the scene on the right changes to show each one with a real listing.
 */
export function ApplyStory({ places }: { places: Place[] }) {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const fill = useTransform(scrollYProgress, [0.03, 0.97], [0, 1], { clamp: true });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.min(STEPS.length - 1, Math.max(0, Math.floor(((v - 0.03) / 0.94) * STEPS.length)));
    setStep((prev) => (prev === i ? prev : i));
  });

  // One scroll gesture moves exactly one step (see useStepSnap).
  useStepSnap({
    sectionRef,
    steps: STEPS.length,
    enabled: !reduce,
    stepY: (i) => {
      const el = sectionRef.current;
      if (!el) return 0;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const range = el.offsetHeight - window.innerHeight;
      return Math.round(top + range * (0.03 + (0.94 * (i + 0.5)) / STEPS.length));
    },
  });

  const example =
    places.filter((p) => statusOf(p) !== "closed" && p.placementType === "Co-op").sort((a, b) => a.closes.localeCompare(b.closes))[0] ??
    places[0];

  if (reduce || !example) {
    return (
      <section ref={sectionRef} aria-labelledby="steps-title" className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <h2 id="steps-title" className="text-2xl font-bold text-navy sm:text-[1.75rem]">
          How to apply, in 4 steps
        </h2>
        <ol className="panel mt-5 grid gap-6 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="grid size-10 place-items-center rounded-full bg-navy font-bold text-white">{i + 1}</span>
              <span className="mt-3 block font-semibold text-navy">{s.title}</span>
              <span className="mt-1 block text-sm text-muted">{s.text}</span>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section ref={sectionRef} aria-labelledby="steps-title" className="relative mt-24" style={{ height: "230vh" }}>
      <div className="sticky top-[4.5rem] mx-auto grid h-[calc(100vh-4.5rem)] max-w-6xl content-center gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
        <div>
          <h2 id="steps-title" className="text-[clamp(1.7rem,3.2vw,2.4rem)] leading-tight font-bold tracking-[-0.02em] text-navy">
            How to apply, in 4 steps
          </h2>
          <ol className="relative mt-6 space-y-1 pl-8 sm:mt-8">
            <span className="absolute top-2 bottom-2 left-[0.6rem] w-0.5 rounded-full bg-navy-100" aria-hidden />
            <motion.span
              style={{ scaleY: fill }}
              className="absolute top-2 bottom-2 left-[0.6rem] w-0.5 origin-top rounded-full bg-navy"
              aria-hidden
            />
            {STEPS.map((s, i) => {
              const state = i < step ? "done" : i === step ? "now" : "next";
              return (
                <li key={s.title} aria-current={state === "now" ? "step" : undefined} className="relative py-2 sm:py-3">
                  <span
                    className={`absolute top-3 -left-8 grid size-5 place-items-center rounded-full border-2 transition-colors duration-300 sm:top-4 ${
                      state === "next" ? "border-navy-200 bg-white" : "border-navy bg-navy text-white"
                    }`}
                  >
                    {state === "done" && <Check className="size-3" strokeWidth={3} aria-hidden />}
                  </span>
                  <span
                    className={`block font-semibold transition-colors duration-300 sm:text-lg ${state === "next" ? "text-muted" : "text-navy"}`}
                  >
                    {i + 1}. {s.title}
                  </span>
                  <span
                    className={`grid transition-[grid-template-rows,opacity] duration-500 ${
                      state === "now" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <span className="overflow-hidden text-[0.95rem] text-body">{s.text}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="relative h-[19rem] sm:h-[23rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="panel-raised absolute inset-0 overflow-hidden p-5 sm:p-7"
            >
              {step === 0 && <SceneFind places={places} />}
              {step === 1 && <SceneCheck place={example} />}
              {step === 2 && <SceneRemind place={example} />}
              {step === 3 && <SceneApply place={example} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

const rise = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.15 + i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
});

function SceneFind({ places }: { places: Place[] }) {
  const rows = places.filter((p) => statusOf(p) !== "closed" && p.faculties.includes("College of Computing")).slice(0, 3);
  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border border-rule bg-[#fbfcfe] px-3 py-2.5 text-muted">
        <Search className="size-4" aria-hidden />
        <motion.span initial={{ width: 0 }} animate={{ width: "auto" }} transition={{ duration: 0.8 }} className="overflow-hidden whitespace-nowrap text-ink">
          Computing
        </motion.span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["CoC · Computing", "All types", "All of Thailand"].map((c, i) => (
          <motion.span key={c} {...rise(i)} className="rounded-md bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy">
            {c}
          </motion.span>
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {rows.map((p, i) => (
          <motion.li key={p.id} {...rise(i + 2)} className="flex items-center gap-3 rounded-xl border border-rule p-2.5">
            <DateBlock iso={p.closes} status={statusOf(p)} />
            <span className="min-w-0">
              <span className="block truncate font-semibold text-navy">{p.role}</span>
              <span className="block truncate text-sm text-muted">
                {TYPE_INFO[p.placementType].short} · {placeLocation(p)}
              </span>
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function SceneCheck({ place }: { place: Place }) {
  return (
    <div>
      <p className="text-sm text-muted">{place.company}</p>
      <p className="text-xl font-bold text-navy">{place.role}</p>
      <p className="mt-4 text-sm font-semibold text-navy">Who can apply</p>
      <ul className="mt-2 space-y-2.5">
        {place.requirements.slice(0, 3).map((r, i) => (
          <motion.li key={r} {...rise(i)} className="flex items-start gap-2.5">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.35 + i * 0.25, type: "spring", stiffness: 300, damping: 18 }}
              className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success text-white"
            >
              <Check className="size-3" strokeWidth={3} aria-hidden />
            </motion.span>
            <span className="text-[0.95rem] text-body">{r}</span>
          </motion.li>
        ))}
      </ul>
      <motion.p {...rise(4)} className="mt-5 inline-flex rounded-full bg-[#e3f4ec] px-3 py-1 text-sm font-semibold text-success">
        You can apply
      </motion.p>
    </div>
  );
}

function SceneRemind({ place }: { place: Place }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4">
        <DateBlock iso={place.closes} status={statusOf(place)} />
        <span>
          <span className="block text-sm text-muted">Applications close</span>
          <span className="block text-lg font-bold text-navy">{longDate(place.closes)}</span>
        </span>
      </div>
      <motion.div {...rise(1)} className="btn-secondary mt-5 w-fit text-sm">
        <CalendarPlus className="size-4" aria-hidden /> Add to Google Calendar
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 220, damping: 20 }}
        className="mt-auto flex items-center gap-3 rounded-xl bg-navy p-3.5 text-white shadow-[0_18px_30px_-16px_rgb(32_54_105/0.8)]"
      >
        <span className="grid size-9 place-items-center rounded-lg bg-white/10 text-gold">
          <BellRing className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 text-sm">
          <span className="block font-semibold">Reminder: {place.role}</span>
          <span className="block truncate text-navy-200">Deadline {longDate(place.closes)}</span>
        </span>
      </motion.div>
    </div>
  );
}

function SceneApply({ place }: { place: Place }) {
  return (
    <div className="flex h-full flex-col text-[0.95rem]">
      <p className="flex items-center gap-2 font-semibold text-navy">
        <Mail className="size-4" aria-hidden /> New email
      </p>
      <dl className="mt-3 divide-y divide-rule border-y border-rule">
        <motion.div {...rise(0)} className="flex gap-3 py-2">
          <dt className="w-14 text-muted">To</dt>
          <dd className="truncate text-ink">{place.contactEmail}</dd>
        </motion.div>
        <motion.div {...rise(1)} className="flex gap-3 py-2">
          <dt className="w-14 text-muted">Subject</dt>
          <dd className="truncate text-ink">Internship application: {place.role} (PSU Phuket)</dd>
        </motion.div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        {["CV.pdf", "Transcript.pdf", "Co-op form.pdf"].map((f, i) => (
          <motion.span key={f} {...rise(i + 2)} className="inline-flex items-center gap-1 rounded-md bg-navy-50 px-2 py-1 text-xs font-medium text-navy">
            <Paperclip className="size-3" aria-hidden /> {f}
          </motion.span>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="text-sm text-muted">
          {allowanceText(place.allowance, place.payPer)} · before {longDate(place.closes)}
        </span>
        <motion.span {...rise(5)} className="btn-primary h-10 px-4 text-sm">
          <Mail className="size-4" aria-hidden /> Send
        </motion.span>
      </div>
    </div>
  );
}
