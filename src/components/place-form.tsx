"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, X } from "lucide-react";
import { FACULTY_INFO } from "@/lib/faculties";
import { TYPE_INFO } from "@/lib/placement";
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

export const EMPTY_PLACE: Place = {
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

const area = "field h-auto min-h-[6rem] py-2.5 leading-relaxed";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

const lines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/**
 * Add or edit a place in a side panel. Sections keep a long form easy to scan;
 * the footer with Save stays visible. Closing with unsaved changes asks first.
 */
export function PlaceDrawer({
  initial,
  title,
  existingIds,
  onSave,
  onClose,
}: {
  initial?: Place;
  title: string;
  existingIds: string[];
  onSave: (place: Place) => void;
  onClose: () => void;
}) {
  const start = initial ?? EMPTY_PLACE;
  const [p, setP] = useState<Place>(start);
  const [duties, setDuties] = useState(start.duties.join("\n"));
  const [reqs, setReqs] = useState(start.requirements.join("\n"));
  const [benefits, setBenefits] = useState((start.benefits ?? []).join("\n"));
  const [docs, setDocs] = useState((start.documents ?? []).join("\n"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmClose, setConfirmClose] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const dirty =
    JSON.stringify(p) !== JSON.stringify(start) ||
    duties !== start.duties.join("\n") ||
    reqs !== start.requirements.join("\n") ||
    benefits !== (start.benefits ?? []).join("\n") ||
    docs !== (start.documents ?? []).join("\n");

  const requestClose = () => (dirty ? setConfirmClose(true) : onClose());
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  // Focus the panel, close on Escape, and keep the page behind from scrolling.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = overflow;
      prev?.focus();
    };
  }, []);

  const set = <K extends keyof Place>(key: K, value: Place[K]) => setP((prev) => ({ ...prev, [key]: value }));

  function toggleFaculty(f: Faculty) {
    set("faculties", p.faculties.includes(f) ? p.faculties.filter((x) => x !== f) : [...p.faculties, f]);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!p.company.trim()) next.company = "Enter the company or organisation name.";
    if (!p.role.trim()) next.role = "Enter the role.";
    if (p.faculties.length === 0) next.faculties = "Choose at least one faculty.";
    if (!p.area.trim()) next.area = "Enter the district or town, or write Remote.";
    if (!p.closes) next.closes = "Choose the application deadline.";
    if (!p.starts) next.starts = "Choose the start date.";
    if (!p.ends) next.ends = "Choose the end date.";
    else if (p.starts && p.ends < p.starts) next.ends = "The end date must be after the start date.";
    if (!p.summary.trim()) next.summary = "Write one or two sentences about the place.";
    if (!/^\S+@\S+\.\S+$/.test(p.contactEmail)) next.contactEmail = "Enter a valid email, like name@company.com.";
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("[data-error-summary]")?.focus());
      return;
    }

    let id = p.id;
    if (!id) {
      const base = slugify(`${p.company} ${p.role}`) || "place";
      id = base;
      for (let n = 2; existingIds.includes(id); n++) id = `${base}-${n}`;
    }
    onSave({
      ...p,
      id,
      duties: lines(duties),
      requirements: lines(reqs),
      benefits: lines(benefits),
      documents: lines(docs),
    });
  }

  const errorCount = Object.keys(errors).length;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="presentation">
      <button
        type="button"
        aria-label="Close panel"
        onClick={requestClose}
        className="drawer-backdrop absolute inset-0 bg-navy-950/40 backdrop-blur-[2px]"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-lenis-prevent
        className="drawer-panel relative flex h-full w-full max-w-2xl flex-col bg-ground shadow-[-24px_0_60px_-20px_rgb(15_27_56/0.45)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-rule bg-white px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-xl font-bold text-navy">
              {title}
            </h2>
            <p className="text-sm text-muted">Fields marked * are required.</p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-navy-50 hover:text-navy"
          >
            <X className="size-5" aria-hidden />
            <span className="sr-only">Close</span>
          </button>
        </header>

        <form id="place-form" onSubmit={submit} noValidate className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
          {errorCount > 0 && (
            <div
              data-error-summary
              tabIndex={-1}
              role="alert"
              className="flex gap-3 rounded-xl border border-danger/30 bg-[#fdf1f0] px-4 py-3 text-[0.95rem] text-danger"
            >
              <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
              <span>
                {errorCount === 1 ? "1 field needs" : `${errorCount} fields need`} attention. Fix the highlighted fields,
                then save again.
              </span>
            </div>
          )}

          <FormSection title="Basics">
            <Field label="Company or organisation" required error={errors.company}>
              {(props) => <input {...props} className="field" value={p.company} onChange={(e) => set("company", e.target.value)} />}
            </Field>
            <Field label="Role" required error={errors.role}>
              {(props) => <input {...props} className="field" value={p.role} onChange={(e) => set("role", e.target.value)} />}
            </Field>
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-sm font-semibold text-navy">Type of placement</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {PLACEMENT_TYPES.map((t) => (
                  <label
                    key={t}
                    className={`cursor-pointer rounded-xl border px-3 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-navy-600 ${
                      p.placementType === t ? "border-navy bg-navy-50" : "border-rule bg-white hover:border-navy-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="placementType"
                      className="sr-only"
                      checked={p.placementType === t}
                      onChange={() =>
                        setP((prev) => ({
                          ...prev,
                          placementType: t as PlacementType,
                          payPer: t === "Part-time" ? "hour" : "month",
                          hoursPerWeek: t === "Part-time" ? (prev.hoursPerWeek ?? 10) : undefined,
                        }))
                      }
                    />
                    <span className="block font-semibold text-navy">{TYPE_INFO[t].short}</span>
                    <span className="block text-xs text-muted">{TYPE_INFO[t].length}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="sm:col-span-2" aria-describedby={errors.faculties ? "faculties-error" : undefined}>
              <legend className="mb-2 text-sm font-semibold text-navy">
                Open to students from <span className="text-danger">*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {FACULTIES.map((f) => {
                  const on = p.faculties.includes(f);
                  return (
                    <label
                      key={f}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-navy-600 ${
                        on ? "border-navy bg-navy text-white" : "border-rule bg-white text-body hover:border-navy-200"
                      }`}
                    >
                      <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleFaculty(f)} />
                      {FACULTY_INFO[f].code} · {FACULTY_INFO[f].short}
                    </label>
                  );
                })}
              </div>
              {errors.faculties && (
                <p id="faculties-error" className="mt-1.5 text-sm text-danger">
                  {errors.faculties}
                </p>
              )}
            </fieldset>
          </FormSection>

          <FormSection title="Location">
            <Field label="Province">
              {(props) => (
                <select {...props} className="field" value={p.province} onChange={(e) => set("province", e.target.value as Province)}>
                  {PROVINCES.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="District or town" required hint="e.g. Kathu or Remote" error={errors.area}>
              {(props) => <input {...props} className="field" value={p.area} onChange={(e) => set("area", e.target.value)} />}
            </Field>
            <Field label="Work mode">
              {(props) => (
                <select {...props} className="field" value={p.workMode} onChange={(e) => set("workMode", e.target.value as WorkMode)}>
                  {WORK_MODES.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Seats">
              {(props) => (
                <input
                  {...props}
                  type="number"
                  min={1}
                  className="field"
                  value={p.seats}
                  onChange={(e) => set("seats", Math.max(1, Number(e.target.value) || 1))}
                />
              )}
            </Field>
          </FormSection>

          <FormSection title="Dates and pay">
            <Field label="Applications close" required error={errors.closes}>
              {(props) => <input {...props} type="date" className="field" value={p.closes} onChange={(e) => set("closes", e.target.value)} />}
            </Field>
            <Field label={p.payPer === "hour" ? "Pay per hour (THB)" : "Monthly allowance (THB)"} hint="0 = unpaid">
              {(props) => (
                <input
                  {...props}
                  type="number"
                  min={0}
                  step={p.payPer === "hour" ? 10 : 500}
                  className="field"
                  value={p.allowance}
                  onChange={(e) => set("allowance", Math.max(0, Number(e.target.value) || 0))}
                />
              )}
            </Field>
            <Field label="Starts" required error={errors.starts}>
              {(props) => <input {...props} type="date" className="field" value={p.starts} onChange={(e) => set("starts", e.target.value)} />}
            </Field>
            <Field label="Ends" required error={errors.ends}>
              {(props) => <input {...props} type="date" className="field" value={p.ends} onChange={(e) => set("ends", e.target.value)} />}
            </Field>
            {p.placementType === "Part-time" && (
              <Field label="Hours per week">
                {(props) => (
                  <input
                    {...props}
                    type="number"
                    min={1}
                    max={40}
                    className="field"
                    value={p.hoursPerWeek ?? 10}
                    onChange={(e) => set("hoursPerWeek", Math.min(40, Math.max(1, Number(e.target.value) || 1)))}
                  />
                )}
              </Field>
            )}
          </FormSection>

          <FormSection title="Details" hint="For lists, put one item per line.">
            <Field label="About this place" required error={errors.summary} wide>
              {(props) => <textarea {...props} rows={3} className={area} value={p.summary} onChange={(e) => set("summary", e.target.value)} />}
            </Field>
            <Field label="What the student will do">
              {(props) => <textarea {...props} rows={4} className={area} value={duties} onChange={(e) => setDuties(e.target.value)} />}
            </Field>
            <Field label="Who can apply">
              {(props) => <textarea {...props} rows={4} className={area} value={reqs} onChange={(e) => setReqs(e.target.value)} />}
            </Field>
            <Field label="Benefits" hint="e.g. Meals provided">
              {(props) => <textarea {...props} rows={4} className={area} value={benefits} onChange={(e) => setBenefits(e.target.value)} />}
            </Field>
            <Field label="Documents to send" hint="e.g. CV">
              {(props) => <textarea {...props} rows={4} className={area} value={docs} onChange={(e) => setDocs(e.target.value)} />}
            </Field>
          </FormSection>

          <FormSection title="How to apply">
            <Field label="Instructions for students" wide>
              {(props) => (
                <textarea {...props} rows={3} className={area} value={p.howToApply} onChange={(e) => set("howToApply", e.target.value)} />
              )}
            </Field>
            <Field label="Contact name">
              {(props) => <input {...props} className="field" value={p.contactName} onChange={(e) => set("contactName", e.target.value)} />}
            </Field>
            <Field label="Contact email" required error={errors.contactEmail}>
              {(props) => (
                <input {...props} type="email" className="field" value={p.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
              )}
            </Field>
          </FormSection>
        </form>

        <footer className="border-t border-rule bg-white px-5 py-3.5 sm:px-7">
          {confirmClose ? (
            <div className="flex flex-wrap items-center justify-between gap-3" role="alert">
              <p className="text-[0.95rem] font-medium text-ink">Discard your changes?</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmClose(false)} className="btn-secondary h-10 text-sm">
                  Keep editing
                </button>
                <button type="button" onClick={onClose} className="btn-danger h-10 text-sm">
                  Discard
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="hidden text-sm text-muted sm:block">{dirty ? "Unsaved changes" : "No changes yet"}</p>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={requestClose} className="btn-secondary h-10 text-sm">
                  Cancel
                </button>
                <button type="submit" form="place-form" className="btn-primary h-10 text-sm">
                  {initial?.id ? "Save changes" : "Add place"}
                </button>
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

function FormSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="panel p-5">
      <h3 className="font-semibold text-navy">{title}</h3>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  wide,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  wide?: boolean;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string; required?: boolean }) => ReactNode;
}) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={id} className="text-sm font-semibold text-navy">
        {label}
        {required && <span className="text-danger"> *</span>}
        {hint && (
          <span id={`${id}-hint`} className="ml-2 font-normal text-muted">
            {hint}
          </span>
        )}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy, required })}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
