"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Check, X } from "lucide-react";
import { useCompareIds, clearCompare } from "@/lib/compare-store";

export function CompareBar() {
  const ids = useCompareIds();
  const pathname = usePathname();
  const count = ids.length;
  const show = count > 0 && pathname !== "/compare";
  const canCompare = count >= 2;

  return (
    <div
      aria-live="polite"
      className={`fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 transition-all duration-500 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-rule bg-white px-4 py-3 shadow-[0_20px_50px_-20px_rgb(15_27_56/0.45)] sm:px-5">
        <p className="flex items-center gap-2 text-[0.95rem] font-semibold text-navy">
          <span className="grid size-6 place-items-center rounded-full bg-navy text-white">
            <Check className="size-3.5" strokeWidth={3} aria-hidden />
          </span>
          <span className="tabular">{count} of 3 selected</span>
        </p>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={clearCompare}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-navy-50 hover:text-navy"
          >
            <X className="size-4" aria-hidden />
            Clear
          </button>
          {canCompare ? (
            <Link href="/compare" className="btn-primary h-10 px-4 text-sm">
              Compare <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <span className="inline-flex h-10 items-center rounded-[10px] bg-navy-50 px-4 text-sm font-medium text-muted">
              Pick 1 more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
