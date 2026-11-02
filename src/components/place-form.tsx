"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import {
  FACULTIES,
  PLACEMENT_TYPES,
  PROVINCES,
  WORK_MODES,
  type Faculty,
  type PlacementType,
  type Place,
  type Province,
  type WorkMode,
} from "@/lib/types";

const EMPTY: Place = {
  id: "",
  company: "",
  role: "",
  placementType: "Co-op",
  province: "Phuket",
  area: "",
  faculties: [],
  workMode: "On-site",
  allowance: 0,
  payPer: "month",
  closes: "",
  starts: "",
  ends: "",
  seats: 1,
  summary: "",
  duties: [],
  requirements: [],
  benefits: [],
  documents: ["CV", "Transcript"],
  howToApply: "",
  contactName: "",
  contactEmail: "",
};

const input =
  "h-11 w-full rounded-md border border-rule bg-white px-3 text-base hover:border-navy-200 aria-[invalid=true]:border-danger";
const area = "w-full rounded-md border border-rule bg-white px-3 py-2 text-base hover:border-navy-200";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function PlaceForm({
  initial,
  existingIds,
  onSave,
  onCancel,
}: {
  initial?: Place;
  existingIds: string[];
  onSave: (place: Place) => void;
  onCancel: () => void;
}) {
  const [p, setP] = useState<Place>(initial ?? EMPTY);
  const [duties, setDuties] = useState((initial?.duties ?? []).join("\n"));
  const [reqs, setReqs] = useState((initial?.requirements ?? []).join("\n"));
  const [benefits, setBenefits] = useState((initial?.benefits ?? []).join("\n"));
  const [docs, setDocs] = useState((initial?.documents ?? EMPTY.documents).join("\n"));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof Place>(key: K, value: Place[K]) => setP((prev) => ({ ...prev, [key]: value }));

  function toggleFaculty(f: Faculty) {
    set("faculties", p.faculties.includes(f) ? p.faculties.filter((x) => x !== f) : [...p.faculties, f]);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!p.area.trim()) next.area = "Enter the district or town, or write Remote.";
    if (!p.company.trim()) next.company = "Enter the company or organisation name.";
    if (!p.role.trim()) next.role = "Enter the internship role.";
    if (p.faculties.length === 0) next.faculties = "Choose at least one faculty.";
    if (!p.closes) next.closes = "Choose the application deadline.";
    if (!p.starts) next.starts = "Choose the start date.";
    if (!p.ends) next.ends = "Choose the end date.";
    else if (p.starts && p.ends < p.starts) next.ends = "The end date must be after the start date.";
    if (!/^\S+@\S+\.\S+$/.test(p.contactEmail)) next.contactEmail = "Enter a valid email, like name@company.com.";
    if (!p.summary.trim()) next.summary = "Write one or two sentences about the internship.";
    setErrors(next);
    if (Object.keys(next).length) return;

    let id = p.id;
    if (!id) {
      const base = slugify(`${p.company} ${p.role}`) || "place";
      id = base;
      for (let n = 2; existingIds.includes(id); n++) id = `${base}-${n}`;
    }
    const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
    onSave({ ...p, id, duties: lines(duties), requirements: lines(reqs), benefits: lines(benefits), documents: lines(docs) });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mb-8 rounded-xl border border-navy-200 bg-white p-5 shadow-[0_8px_24px_rgb(15_27_56/0.08)] sm:p-6"
    >
      <h2 className="font-board text-2xl font-bold text-navy-950">
        {initial ? `Edit: ${initial.role}` : "Add a place"}
      </h2>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Company or organisation" error={errors.company}>
          {(props) => <input {...props} className={input} value={p.company} onChange={(e) => set("company", e.target.value)} />}
        </Field>
        <Field label="Role" error={errors.role}>
          {(props) => <input {...props} className={input} value={p.role} onChange={(e) => set("role", e.target.value)} />}
        </Field>
        <Field label="Type of placement">
          {(props) => (
            <select
              {...props}
              className={input}
              value={p.placementType}
              onChange={(e) => {
                const t = e.target.value as PlacementType;
                setP((prev) => ({
                  ...prev,
                  placementType: t,
                  payPer: t === "Part-time" ? "hour" : "month",
                  hoursPerWeek: t === "Part-time" ? (prev.hoursPerWeek ?? 10) : undefined,
                }));
              }}
            >
              {PLACEMENT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Province">
          {(props) => (
            <select {...props} className={input} value={p.province} onChange={(e) => set("province", e.target.value as Province)}>
              {PROVINCES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="District or town" hint="e.g. Kathu, Sathorn, or Remote" error={errors.area}>
          {(props) => <input {...props} className={input} value={p.area} onChange={(e) => set("area", e.target.value)} />}
        </Field>
        <Field label="Work mode">
          {(props) => (
            <select {...props} className={input} value={p.workMode} onChange={(e) => set("workMode", e.target.value as WorkMode)}>
              {WORK_MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          )}
        </Field>

        <fieldset className="sm:col-span-2" aria-describedby={errors.faculties ? "faculties-error" : undefined}>
          <legend className="mb-2 font-semibold">Open to students from</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {FACULTIES.map((f) => (
              <label key={f} className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" className="size-4" checked={p.faculties.includes(f)} onChange={() => toggleFaculty(f)} />
                {f}
              </label>
            ))}
          </div>
          {errors.faculties && (
            <p id="faculties-error" className="mt-1 text-sm text-danger">
              {errors.faculties}
            </p>
          )}
        </fieldset>

        <Field label="Applications close" error={errors.closes}>
          {(props) => <input {...props} type="date" className={input} value={p.closes} onChange={(e) => set("closes", e.target.value)} />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={p.payPer === "hour" ? "Pay per hour (THB)" : "Monthly allowance (THB)"} hint="0 for unpaid">
            {(props) => (
              <input
                {...props}
                type="number"
                min={0}
                step={p.payPer === "hour" ? 10 : 500}
                className={input}
                value={p.allowance}
                onChange={(e) => set("allowance", Math.max(0, Number(e.target.value) || 0))}
              />
            )}
          </Field>
          <Field label="Seats">
            {(props) => (
              <input
                {...props}
                type="number"
                min={1}
                className={input}
                value={p.seats}
                onChange={(e) => set("seats", Math.max(1, Number(e.target.value) || 1))}
              />
            )}
          </Field>
        </div>
        {p.placementType === "Part-time" && (
          <Field label="Hours per week">
            {(props) => (
              <input
                {...props}
                type="number"
                min={1}
                max={40}
                className={input}
                value={p.hoursPerWeek ?? 10}
                onChange={(e) => set("hoursPerWeek", Math.min(40, Math.max(1, Number(e.target.value) || 1)))}
              />
            )}
          </Field>
        )}
        <Field label="Starts" error={errors.starts}>
          {(props) => <input {...props} type="date" className={input} value={p.starts} onChange={(e) => set("starts", e.target.value)} />}
        </Field>
        <Field label="Ends" error={errors.ends}>
          {(props) => <input {...props} type="date" className={input} value={p.ends} onChange={(e) => set("ends", e.target.value)} />}
        </Field>

        <div className="sm:col-span-2">
          <Field label="About the internship" error={errors.summary}>
            {(props) => <textarea {...props} rows={3} className={area} value={p.summary} onChange={(e) => set("summary", e.target.value)} />}
          </Field>
        </div>
        <Field label="What the intern will do" hint="One item per line">
          {(props) => <textarea {...props} rows={4} className={area} value={duties} onChange={(e) => setDuties(e.target.value)} />}
        </Field>
        <Field label="Who can apply" hint="One item per line">
          {(props) => <textarea {...props} rows={4} className={area} value={reqs} onChange={(e) => setReqs(e.target.value)} />}
        </Field>
        <Field label="Benefits" hint="One item per line, e.g. Meals provided">
          {(props) => <textarea {...props} rows={4} className={area} value={benefits} onChange={(e) => setBenefits(e.target.value)} />}
        </Field>
        <Field label="Documents to send" hint="One item per line, e.g. CV">
          {(props) => <textarea {...props} rows={4} className={area} value={docs} onChange={(e) => setDocs(e.target.value)} />}
        </Field>
        <div className="sm:col-span-2">
          <Field label="How to apply">
            {(props) => <textarea {...props} rows={2} className={area} value={p.howToApply} onChange={(e) => set("howToApply", e.target.value)} />}
          </Field>
        </div>
        <Field label="Contact name">
          {(props) => <input {...props} className={input} value={p.contactName} onChange={(e) => set("contactName", e.target.value)} />}
        </Field>
        <Field label="Contact email" error={errors.contactEmail}>
          {(props) => (
            <input {...props} type="email" className={input} value={p.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          )}
        </Field>
      </div>

      {Object.keys(errors).length > 0 && (
        <p role="alert" className="mt-5 text-danger">
          Fix the highlighted fields, then save again.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" className="h-11 rounded-md bg-navy px-5 font-board text-lg font-semibold text-white hover:bg-navy-700">
          {initial ? "Save changes" : "Add place"}
        </button>
        <button type="button" onClick={onCancel} className="h-11 rounded-md px-4 font-board text-lg font-semibold text-navy hover:bg-navy-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-semibold">
        {label}
        {hint && (
          <span id={`${id}-hint`} className="ml-2 text-sm font-normal text-muted">
            {hint}
          </span>
        )}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
