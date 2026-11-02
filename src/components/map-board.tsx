"use client";

import Link from "next/link";
import { usePlaces } from "@/lib/store";
import { statusOf } from "@/lib/status";
import { PROVINCES } from "@/lib/types";
import { ThailandMap } from "./thailand-map";
import { useMemo } from "react";

export function MapBoard() {
  const places = usePlaces();

  const areaCounts = useMemo(() => {
    if (!places) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const area of PROVINCES) map.set(area, 0);
    for (const p of places) {
      if (statusOf(p) !== "closed") {
        map.set(p.province, (map.get(p.province) ?? 0) + 1);
      }
    }
    return map;
  }, [places]);

  const totalOpen = useMemo(() => {
    let sum = 0;
    areaCounts.forEach((v) => (sum += v));
    return sum;
  }, [areaCounts]);

  return (
    <>
      <section className="hero-band">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-10 sm:px-6 sm:pt-12">
          <h1 className="text-[clamp(2rem,4.5vw,2.75rem)] leading-tight font-bold tracking-[-0.02em] text-navy">
            Find by province
          </h1>
          <p className="mt-2 max-w-2xl text-body">Each pin shows how many places are open in that province. Select a pin to see them, or zoom in.</p>
        </div>
      </section>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">

        {places === null ? (
          <div className="h-[620px] w-full animate-pulse rounded-2xl bg-white" />
        ) : (
          <ThailandMap places={places} />
        )}

        {/* Legend / area summary */}
        <section aria-label="Areas summary">
          <h2 className="mb-4 text-xl font-bold text-navy">
            All provinces
            <span className="ml-3 text-base font-normal text-muted">
              {totalOpen} open position{totalOpen !== 1 ? "s" : ""}
            </span>
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {PROVINCES.map((area) => {
              const count = areaCounts.get(area) ?? 0;
              const href = `/positions?province=${encodeURIComponent(area)}`;
              return (
                <li key={area}>
                  <Link
                    href={href}
                    className="panel flex items-center justify-between px-5 py-4 transition-[border-color,box-shadow] hover:border-navy-200 hover:shadow-[0_10px_30px_-20px_rgb(15_27_56/0.45)]"
                  >
                    <span className="font-medium text-navy">{area}</span>
                    <span className="tabular inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-navy px-2 text-xs font-bold text-white">
                      {count}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
