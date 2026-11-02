"use client";

import { Building2, GraduationCap, MapPinned, Wallet } from "lucide-react";
import type { Place } from "@/lib/types";
import { statusOf } from "@/lib/status";
import { CountUp, Reveal } from "./motion-bits";

export function StatsBand({ places }: { places: Place[] }) {
  const open = places.filter((p) => statusOf(p) !== "closed");
  const provinces = new Set(open.map((p) => p.province)).size;
  const best = Math.max(0, ...open.filter((p) => p.payPer === "month").map((p) => p.allowance));

  const stats = [
    { icon: Building2, value: open.length, label: "Places open now" },
    { icon: MapPinned, value: provinces, label: "Provinces" },
    { icon: GraduationCap, value: 4, label: "Phuket Campus faculties" },
    { icon: Wallet, value: best, label: "Top monthly allowance", format: (n: number) => `฿${n.toLocaleString("en-US")}` },
  ];

  return (
    <section aria-label="At a glance" className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-rule bg-rule lg:grid-cols-4">
        {stats.map(({ icon: Icon, value, label, format }, i) => (
          <Reveal as="li" key={label} delay={i * 0.08} className="bg-white px-5 py-6 sm:px-7 sm:py-8">
            <Icon className="size-6 text-navy-600" aria-hidden />
            <p className="mt-4 text-[clamp(1.9rem,4vw,2.75rem)] leading-none font-bold tracking-[-0.02em] text-navy">
              <CountUp to={value} format={format} />
            </p>
            <p className="mt-2 text-sm text-muted">{label}</p>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
