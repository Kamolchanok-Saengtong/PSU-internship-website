"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox, Loader2, Play, RefreshCw } from "lucide-react";
import type { OutboxEmail } from "@/server/db";

/** Development only: see the emails the app has sent, and run the reminder job by hand. */
export function DevOutbox() {
  const [emails, setEmails] = useState<OutboxEmail[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/dev/outbox");
    setEmails((await res.json()).emails ?? []);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function run() {
    setRunning(true);
    setResult(null);
    const res = await fetch("/api/cron/reminders", { method: "POST" });
    const data = await res.json();
    setResult(
      res.ok
        ? `${data.sent} reminder${data.sent === 1 ? "" : "s"} sent${data.errors?.length ? `, ${data.errors.length} failed` : ""}.`
        : (data.error ?? "Failed."),
    );
    setRunning(false);
    void refresh();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold text-gold-ink">Development only</p>
      <h1 className="text-3xl font-bold text-navy">Email outbox</h1>
      <p className="mt-1 max-w-2xl text-body">
        Without an email service set up, nothing is really sent: emails land here instead. The reminder job normally runs once
        a day; press the button to run it now.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={run} disabled={running} className="btn-primary h-10 text-sm">
          {running ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Play className="size-4" aria-hidden />} Run reminder check now
        </button>
        <button type="button" onClick={refresh} className="btn-secondary h-10 text-sm">
          <RefreshCw className="size-4" aria-hidden /> Refresh
        </button>
        {result && (
          <p role="status" className="text-sm font-medium text-ink">
            {result}
          </p>
        )}
      </div>

      <section className="panel mt-6 overflow-hidden">
        {emails === null ? (
          <p className="p-6 text-muted">Loading…</p>
        ) : emails.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Inbox className="mx-auto size-8 text-navy-200" aria-hidden />
            <p className="mt-3 font-semibold text-navy">No emails yet</p>
            <p className="mt-1 text-sm text-muted">Turn on a reminder for a saved place that closes soon, then run the check.</p>
          </div>
        ) : (
          <ul className="divide-y divide-rule">
            {emails.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setOpen(open === e.id ? null : e.id)}
                  aria-expanded={open === e.id}
                  className="flex w-full flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3.5 text-left hover:bg-[#fafbfd]"
                >
                  <span className="min-w-0 flex-1 font-semibold text-navy">{e.subject}</span>
                  <span className="text-sm text-body">to {e.to}</span>
                  <span className="text-xs text-muted">
                    {new Date(e.at).toLocaleString("en-GB")} · {e.via}
                  </span>
                </button>
                {open === e.id && (
                  <div className="border-t border-rule bg-white p-5">
                    {/* The email body we built ourselves, shown as it will look. */}
                    <iframe title={e.subject} srcDoc={e.html} sandbox="" className="h-80 w-full rounded-lg border border-rule" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
