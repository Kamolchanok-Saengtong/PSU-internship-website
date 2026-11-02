"use client";

import { useEffect, useState } from "react";
import { Inbox, LayoutList } from "lucide-react";
import { useApplications } from "@/lib/application";
import { AdminPanel } from "./admin-panel";
import { CoopRequests } from "./coop-requests";

type Tab = "places" | "requests";

/** Staff home: manage places, or review co-op requests. The tab is kept in the URL. */
export function StaffTabs() {
  const [tab, setTab] = useState<Tab>("places");
  const waiting = useApplications().filter((a) => a.status === "approving").length;

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "requests") setTab("requests");
  }, []);

  const go = (t: Tab) => {
    setTab(t);
    window.history.replaceState(null, "", t === "requests" ? "/admin?tab=requests" : "/admin");
  };

  return (
    <>
      <div className="border-b border-rule bg-white">
        <div role="tablist" aria-label="Staff" className="mx-auto flex max-w-6xl gap-1 px-4 sm:px-6">
          {(
            [
              ["places", "Places", LayoutList],
              ["requests", "Co-op requests", Inbox],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => go(k)}
              className={`relative flex items-center gap-2 px-3 py-3.5 text-sm font-semibold transition-colors ${
                tab === k ? "text-navy after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-navy" : "text-muted hover:text-navy"
              }`}
            >
              <Icon className="size-4" aria-hidden /> {label}
              {k === "requests" && waiting > 0 && (
                <span className="tabular rounded-full bg-gold px-1.5 text-xs font-bold text-navy-950">{waiting}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      {tab === "places" ? <AdminPanel /> : <CoopRequests />}
    </>
  );
}
