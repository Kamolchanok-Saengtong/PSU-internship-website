"use client";

import { useEffect, useState } from "react";
import { Check, FileText, Gift } from "lucide-react";

/** What the student gets besides pay. */
export function BenefitsList({ benefits }: { benefits: string[] }) {
  if (!benefits.length) return null;
  return (
    <section>
      <h2 className="text-xl font-bold text-navy">Benefits</h2>
      <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-3 rounded-xl border border-rule bg-white px-4 py-3">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#e3f4ec] text-success">
              <Gift className="size-4" aria-hidden />
            </span>
            <span className="text-[0.97rem] text-ink">{b}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Documents to send, as a checklist the student can tick while preparing.
 * Ticks are kept in this browser only.
 */
export function DocumentsChecklist({ placeId, documents }: { placeId: string; documents: string[] }) {
  const key = `psu-docs:${placeId}`;
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    try {
      setDone(JSON.parse(window.localStorage.getItem(key) ?? "[]"));
    } catch {
      setDone([]);
    }
  }, [key]);

  function toggle(doc: string) {
    setDone((prev) => {
      const next = prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc];
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Storage blocked: ticks last until the tab closes.
      }
      return next;
    });
  }

  if (!documents.length) return null;
  const count = documents.filter((d) => done.includes(d)).length;

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold text-navy">Documents to prepare</h2>
        <p className="tabular text-sm text-muted" aria-live="polite">
          {count === documents.length ? (
            <span className="font-semibold text-success">All ready</span>
          ) : (
            `${count} of ${documents.length} ready`
          )}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-100" aria-hidden>
        <div
          className="h-full rounded-full bg-success transition-[width] duration-500"
          style={{ width: `${(count / documents.length) * 100}%` }}
        />
      </div>
      <ul className="mt-3 space-y-2">
        {documents.map((d) => {
          const on = done.includes(d);
          return (
            <li key={d}>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  on ? "border-success/40 bg-[#f1faf5]" : "border-rule bg-white hover:border-navy-200"
                }`}
              >
                <input type="checkbox" checked={on} onChange={() => toggle(d)} className="peer sr-only" />
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-md border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-navy-600 ${
                    on ? "border-success bg-success text-white" : "border-navy-200 bg-white"
                  }`}
                  aria-hidden
                >
                  {on && <Check className="size-4" strokeWidth={3} />}
                </span>
                <FileText className="size-4 shrink-0 text-muted" aria-hidden />
                <span className={`text-[0.97rem] ${on ? "text-muted line-through" : "text-ink"}`}>{d}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-sm text-muted">Tick each one when it&apos;s ready. Saved in this browser only.</p>
    </section>
  );
}
