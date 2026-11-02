"use client";

import { useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { deletePlace, resetToSample, savePlace, usePlaces } from "@/lib/store";
import { allowanceText, shortDate, statusOf } from "@/lib/status";
import type { Place } from "@/lib/types";
import { PlaceForm } from "./place-form";
import { StatusBadge } from "./status-badge";

type Editing = { mode: "new" } | { mode: "edit"; place: Place } | null;

export function AdminPanel() {
  const places = usePlaces();
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const sorted = places ? [...places].sort((a, b) => a.closes.localeCompare(b.closes)) : [];

  function handleSave(place: Place) {
    savePlace(place);
    setNotice(`Saved "${place.role}" at ${place.company}.`);
    setEditing(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="flex flex-col gap-4 pt-10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-board text-4xl font-bold tracking-[-0.01em] text-navy-950">Manage internship places</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Add, edit, or remove places shown on the student board.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setEditing({ mode: "new" });
            }}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-navy px-4 font-board text-lg font-semibold text-white hover:bg-navy-700"
          >
            <Plus className="size-5" aria-hidden /> Add a place
          </button>
        )}
      </section>

      <p className="mb-6 rounded-md border border-gold bg-gold-soft px-4 py-3 text-[0.95rem] text-gold-ink">
        <strong>Draft mode:</strong> there is no staff login yet, and changes are saved only in this browser. Connect a
        database and sign-in before going live.
      </p>

      {notice && (
        <p role="status" className="mb-6 rounded-md bg-navy-100 px-4 py-3 text-navy">
          {notice}
        </p>
      )}

      {editing && (
        <PlaceForm
          key={editing.mode === "edit" ? editing.place.id : "new"}
          initial={editing.mode === "edit" ? editing.place : undefined}
          existingIds={places?.map((p) => p.id) ?? []}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      <section className="overflow-hidden rounded-xl border border-navy-900 bg-white">
        <div className="on-navy flex items-center justify-between gap-4 bg-navy-900 px-4 py-3 text-white sm:px-5">
          <h2 className="font-board text-xl font-bold tracking-wide">All places</h2>
          <span className="tabular text-sm text-navy-200">{places ? `${places.length} listed` : "Loading…"}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left">
            <thead className="bg-navy-50 font-board text-sm tracking-wide text-muted uppercase">
              <tr>
                <th className="px-5 py-2 font-semibold">Closes</th>
                <th className="px-3 py-2 font-semibold">Company & role</th>
                <th className="px-3 py-2 font-semibold">Type · Province</th>
                <th className="px-3 py-2 text-right font-semibold">Allowance</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-5 py-2 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} className="border-t border-rule align-middle">
                  <td className="tabular px-5 py-3 font-board font-semibold">{shortDate(p.closes)}</td>
                  <td className="px-3 py-3">
                    <span className="block font-semibold text-navy-950">{p.role}</span>
                    <span className="text-sm text-muted">{p.company}</span>
                  </td>
                  <td className="px-3 py-3 text-[0.95rem]">
                    <span className="block">{p.placementType}</span>
                    <span className="text-sm text-muted">{p.province}</span>
                  </td>
                  <td className="tabular px-3 py-3 text-right text-[0.95rem]">{allowanceText(p.allowance, p.payPer)}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={statusOf(p)} />
                  </td>
                  <td className="px-5 py-3">
                    {confirmDelete === p.id ? (
                      <span className="flex items-center justify-end gap-2 text-sm whitespace-nowrap">
                        Delete this place?
                        <button
                          type="button"
                          onClick={() => {
                            deletePlace(p.id);
                            setConfirmDelete(null);
                            setNotice(`Deleted "${p.role}" at ${p.company}.`);
                          }}
                          className="rounded-md bg-danger px-3 py-1.5 font-semibold text-white"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-md px-3 py-1.5 font-semibold text-navy hover:bg-navy-50"
                        >
                          Keep
                        </button>
                      </span>
                    ) : (
                      <span className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setNotice(null);
                            setEditing({ mode: "edit", place: p });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-navy hover:bg-navy-50"
                        >
                          <Pencil className="size-4" aria-hidden /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(p.id)}
                          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-danger hover:bg-red-50"
                        >
                          <Trash2 className="size-4" aria-hidden /> Delete
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {places && places.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted">
                    No places yet. Use “Add a place” to list the first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        {confirmReset ? (
          <>
            <span>Replace every place with the original sample data?</span>
            <button
              type="button"
              onClick={() => {
                resetToSample();
                setConfirmReset(false);
                setNotice("Sample data restored.");
              }}
              className="rounded-md bg-danger px-3 py-1.5 font-semibold text-white"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="rounded-md px-3 py-1.5 font-semibold text-navy hover:bg-navy-100"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 font-semibold text-muted hover:text-navy"
          >
            <RotateCcw className="size-4" aria-hidden /> Reset to sample data
          </button>
        )}
      </div>
    </div>
  );
}
