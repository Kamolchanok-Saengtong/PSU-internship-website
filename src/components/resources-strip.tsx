"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { KIND_INFO } from "@/lib/resources";
import { useResources } from "@/lib/resources-client";
import { KIND_ICON, ResourceAction, splitTitle } from "./resource-item";

/** A short list of news and documents, linking to the full page. */
export function ResourcesStrip({ title, intro, pinnedOnly = false, limit = 3 }: { title: string; intro: string; pinnedOnly?: boolean; limit?: number }) {
  const { list } = useResources();
  const items = (list ?? []).filter((r) => !pinnedOnly || r.pinned).slice(0, limit);
  if (list && items.length === 0) return null;

  return (
    <section aria-label={title} className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-navy">{title}</h2>
          <p className="mt-0.5 text-sm text-muted">{intro}</p>
        </div>
        <Link href="/resources" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:underline">
          All news &amp; documents <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <ul className="mt-4 divide-y divide-rule">
        {list === null
          ? [0, 1].map((i) => <li key={i} className="my-2 h-12 animate-pulse rounded-lg bg-navy-50" />)
          : items.map((r) => {
              const Icon = KIND_ICON[r.kind];
              const t = splitTitle(r.title);
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  <Icon className="size-5 shrink-0 text-navy-600" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{t.main}</p>
                    <p className="text-xs text-muted">{KIND_INFO[r.kind].label}</p>
                  </div>
                  <ResourceAction r={r} compact />
                </li>
              );
            })}
      </ul>
    </section>
  );
}
