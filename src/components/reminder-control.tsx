"use client";

import { useId, useState, type FormEvent } from "react";
import { Bell, BellOff, BellRing, Check, Loader2, Mail, Pencil } from "lucide-react";
import { REMINDER_DAYS, isEmail, newReminder, type Reminder } from "@/lib/reminders";
import { saveAccountEmail, saveReminder } from "@/lib/saved";

const dayLabel = (n: number) => (n === 1 ? "1 day before" : `${n} days before`);

function summary(r: Reminder | undefined, accountEmail: string) {
  if (!r?.enabled) return null;
  const days = [...r.daysBefore].sort((a, b) => b - a).join(" & ");
  const to = r.useAccountEmail || !r.email ? accountEmail : r.email;
  return { days: `${days} ${r.daysBefore.length === 1 && r.daysBefore[0] === 1 ? "day" : "days"} before`, to };
}

/** "Email me before the deadline" for one saved place. */
export function ReminderControl({
  placeId,
  reminder,
  accountEmail,
  closed,
}: {
  placeId: string;
  reminder: Reminder | undefined;
  accountEmail: string;
  closed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Reminder>(reminder ?? newReminder());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const id = useId();
  const s = summary(reminder, accountEmail);

  if (closed) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted">
        <BellOff className="size-4" aria-hidden /> Closed, no reminders
      </span>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (draft.enabled && !draft.daysBefore.length) return setError("Choose at least one day.");
    if (draft.enabled && !draft.useAccountEmail && !isEmail(draft.email ?? "")) return setError("Enter a valid email, like name@gmail.com.");
    setBusy(true);
    try {
      await saveReminder(placeId, { enabled: draft.enabled, daysBefore: draft.daysBefore, useAccountEmail: draft.useAccountEmail, email: draft.email });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(reminder?.enabled ? reminder : { ...newReminder(), ...(reminder ? { daysBefore: reminder.daysBefore.length ? reminder.daysBefore : [7, 1] } : {}) });
          setOpen(true);
        }}
        aria-expanded={false}
        aria-controls={id}
        className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm font-semibold transition-colors ${
          s ? "bg-navy-50 text-navy hover:bg-navy-100" : "text-navy-600 hover:bg-navy-50"
        }`}
      >
        {s ? <BellRing className="size-4 shrink-0" aria-hidden /> : <Bell className="size-4 shrink-0" aria-hidden />}
        {s ? (
          <span className="min-w-0">
            Email reminder {s.days}
            <span className="block truncate text-xs font-normal text-muted">to {s.to}</span>
          </span>
        ) : (
          "Email me before the deadline"
        )}
      </button>
    );
  }

  return (
    <form id={id} onSubmit={submit} noValidate className="w-full space-y-4 rounded-xl border border-navy-200 bg-white p-4">
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-semibold text-navy">
          <BellRing className="size-4" aria-hidden /> Email me before the deadline
        </span>
        <span className="relative inline-flex">
          <input
            type="checkbox"
            role="switch"
            checked={draft.enabled}
            onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
            className="peer sr-only"
          />
          <span className="h-6 w-11 rounded-full bg-navy-200 transition-colors peer-checked:bg-navy peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-navy-600" />
          <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </span>
      </label>

      {draft.enabled && (
        <>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-navy">When</legend>
            <div className="flex flex-wrap gap-2">
              {REMINDER_DAYS.map((n) => {
                const on = draft.daysBefore.includes(n);
                return (
                  <label
                    key={n}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-navy-600 ${
                      on ? "border-navy bg-navy text-white" : "border-rule text-body hover:border-navy-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={() =>
                        setDraft({ ...draft, daysBefore: on ? draft.daysBefore.filter((x) => x !== n) : [...draft.daysBefore, n] })
                      }
                    />
                    {on && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                    {dayLabel(n)}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-navy">Send to</legend>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <input
                  type="radio"
                  name={`${id}-to`}
                  checked={draft.useAccountEmail}
                  onChange={() => setDraft({ ...draft, useAccountEmail: true })}
                  className="mt-0.5 size-4"
                />
                <span>
                  <span className="font-medium text-ink">My account email</span>
                  <span className="block text-muted">{accountEmail}</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <input
                  type="radio"
                  name={`${id}-to`}
                  checked={!draft.useAccountEmail}
                  onChange={() => setDraft({ ...draft, useAccountEmail: false })}
                  className="mt-0.5 size-4"
                />
                <span className="font-medium text-ink">Another email</span>
              </label>
              {!draft.useAccountEmail && (
                <input
                  type="email"
                  aria-label="Email for this reminder"
                  placeholder="e.g. name@gmail.com"
                  value={draft.email ?? ""}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  className="field ml-6.5 h-10 w-[calc(100%-1.625rem)] text-sm"
                  autoFocus
                />
              )}
            </div>
          </fieldset>
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary h-9 text-sm" disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn-primary h-9 text-sm" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Save
        </button>
      </div>
    </form>
  );
}

/** Shows (and lets the student change) the email reminders go to by default. */
export function AccountEmail({ email }: { email: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(email);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (value.trim() && !isEmail(value)) return setError("Enter a valid email, like name@email.psu.ac.th.");
    setBusy(true);
    setError("");
    try {
      await saveAccountEmail(value.trim());
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy">
        <Mail className="size-4" aria-hidden />
      </span>
      {editing ? (
        <form onSubmit={submit} noValidate className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <label className="min-w-[14rem] flex-1">
            <span className="sr-only">Account email</span>
            <input type="email" value={value} onChange={(e) => setValue(e.target.value)} className="field h-10 text-sm" autoFocus />
          </label>
          <button type="button" onClick={() => setEditing(false)} className="btn-secondary h-10 text-sm" disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-primary h-10 text-sm" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Save
          </button>
          {error && <p className="w-full text-sm text-danger">{error}</p>}
        </form>
      ) : (
        <>
          <p className="min-w-0 flex-1 text-sm text-body">
            Reminders go to your account email <strong className="break-all text-ink">{email}</strong>, unless you choose another one.
          </p>
          <button
            type="button"
            onClick={() => {
              setValue(email);
              setEditing(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-navy-600 hover:bg-navy-50"
          >
            <Pencil className="size-3.5" aria-hidden /> Change
          </button>
        </>
      )}
    </div>
  );
}
