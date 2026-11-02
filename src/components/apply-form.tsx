"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, FileText, Loader2, Paperclip, Send, Upload, X } from "lucide-react";
import {
  CAN_APPLY,
  LEVELS,
  SKILLS,
  STATUS_INFO,
  submitApplication,
  useMyApplication,
  type AppDocument,
  type StudentDetails,
} from "@/lib/application";
import { useSession } from "@/lib/auth";
import { FACULTY_INFO } from "@/lib/faculties";
import { placeLocation } from "@/lib/placement";
import { longDate, statusOf } from "@/lib/status";
import { usePlaces } from "@/lib/store";
import { FACULTIES } from "@/lib/types";
import { StatusPill } from "./application-panel";

const fmtSize = (b: number) => (b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`);
import { TypeTag } from "./position-row";

const STEPS = ["Your details", "Skills", "Documents", "Review"] as const;
const MAX_MB = 10;

export function ApplyForm({ placeId }: { placeId: string }) {
  const router = useRouter();
  const session = useSession("student");
  const places = usePlaces();
  const existing = useMyApplication(session?.id);
  const place = places?.find((p) => p.id === placeId);

  const [step, setStep] = useState(0);
  const [details, setDetails] = useState<StudentDetails>({
    name: "",
    faculty: "College of Computing",
    major: "",
    year: "4",
    gpa: "",
    phone: "",
    email: "",
  });
  const [language, setLanguage] = useState(SKILLS.map((skill) => ({ skill, level: "Good" })));
  const [activities, setActivities] = useState("");
  const [motivation, setMotivation] = useState("");
  const [files, setFiles] = useState<Record<string, AppDocument>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const prefilled = useRef(false);

  // Signed out: sign in first, then come back here.
  useEffect(() => {
    if (session === null) router.replace(`/signin?next=${encodeURIComponent(`/apply/${placeId}`)}`);
  }, [session, router, placeId]);

  // Re-applying after Rechoosing / Repair: start from the earlier answers.
  useEffect(() => {
    if (prefilled.current || !session) return;
    prefilled.current = true;
    if (existing) {
      setDetails({
        name: existing.name,
        faculty: existing.faculty,
        major: existing.major,
        year: existing.year,
        gpa: existing.gpa,
        phone: existing.phone,
        email: existing.email,
      });
      setLanguage(existing.language.map((l) => ({ skill: l.skill as (typeof SKILLS)[number], level: l.level })));
      setActivities(existing.activities.join("\n"));
    } else if (session.name !== session.id) {
      setDetails((d) => ({ ...d, name: session.name }));
    }
  }, [session, existing]);

  if (!session || places === null) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" aria-hidden /> Loading…
        </span>
      </div>
    );
  }

  // Cases where a request can't be sent.
  const blocked = !place
    ? { title: "This place is no longer listed", text: "Choose another co-op place from the positions list." }
    : place.placementType !== "Co-op"
      ? { title: "This is not a co-op place", text: "Co-op requests are only for co-op placements. Use the contact on the place page to apply." }
      : statusOf(place) === "closed"
        ? { title: "Applications have closed", text: `Applications for this place closed on ${longDate(place.closes)}.` }
        : existing && !CAN_APPLY.includes(existing.status)
          ? {
              title: "You already have a request in progress",
              text: `Your co-op request is at "${STATUS_INFO[existing.status].label}". You can choose a new place only if your advisor or the company declines it, or if you cancel it.`,
            }
          : null;

  if (blocked || !place) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="panel p-8 text-center">
          <AlertCircle className="mx-auto size-8 text-navy-200" aria-hidden />
          <h1 className="mt-3 text-2xl font-bold text-navy">{blocked?.title}</h1>
          <p className="mt-2 text-body">{blocked?.text}</p>
          {existing && <StatusPill status={existing.status} className="mt-4" />}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/me" className="btn-primary h-10 text-sm">
              Go to my page
            </Link>
            <Link href="/positions?type=co-op" className="btn-secondary h-10 text-sm">
              Co-op places
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const requiredDocs = place.documents?.length ? place.documents : ["CV", "Transcript"];

  function validate(s: number) {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!details.name.trim()) e.name = "Enter your full name.";
      if (!details.major.trim()) e.major = "Enter your major.";
      if (details.gpa && !/^[0-4](\.\d{1,2})?$/.test(details.gpa.trim())) e.gpa = "Enter a GPA between 0.00 and 4.00.";
      if (!/^0\d{8,9}$/.test(details.phone.replace(/[\s-]/g, ""))) e.phone = "Enter a Thai phone number, like 081 234 5678.";
      if (!/^\S+@\S+\.\S+$/.test(details.email)) e.email = "Enter a valid email, like name@email.psu.ac.th.";
    }
    if (s === 1 && motivation.trim().length < 20) e.motivation = "Write at least one or two sentences (20+ characters).";
    if (s === 2) for (const d of requiredDocs) if (!files[d]) e[`doc:${d}`] = "Attach this file.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const next = () => {
    if (validate(step)) {
      setStep((n) => n + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  async function send() {
    if (!place) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 900));
    submitApplication({
      ...details,
      studentId: session!.id,
      placeId: place.id,
      placeName: `${place.role}, ${place.company}`,
      language,
      activities: activities
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean),
      motivation: motivation.trim(),
      documents: requiredDocs.map((d) => files[d]).filter(Boolean),
    });
    router.push("/me?sent=1");
  }

  return (
    <>
      <section className="hero-band">
        <div className="mx-auto max-w-3xl px-4 pt-8 pb-8 sm:px-6">
          <Link href={`/places/${place.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:underline">
            <ArrowLeft className="size-4" aria-hidden /> Back to the place
          </Link>
          <h1 className="mt-4 text-[clamp(1.8rem,4vw,2.4rem)] leading-tight font-bold tracking-[-0.02em] text-navy">Co-op request</h1>
          <div className="panel mt-4 flex items-center justify-between gap-4 p-4">
            <span className="min-w-0">
              <TypeTag type={place.placementType} />
              <span className="mt-1 block font-semibold text-navy">{place.role}</span>
              <span className="block truncate text-sm text-muted">
                {place.company} · {placeLocation(place)}
              </span>
            </span>
            <span className="shrink-0 text-right text-sm">
              <span className="block text-muted">Closes</span>
              <span className="font-semibold text-ink">{longDate(place.closes)}</span>
            </span>
          </div>
          {existing && existing.status !== "cancel" && (
            <p className="mt-3 flex items-center gap-2 text-sm text-body">
              <StatusPill status={existing.status} /> Your answers from last time are filled in. Sending this replaces your previous place.
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Steps */}
        <ol className="grid grid-cols-4 gap-2" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? "step" : undefined} className="text-center">
              <span
                className={`block h-1.5 rounded-full transition-colors ${i < step ? "bg-navy" : i === step ? "bg-navy-600" : "bg-navy-100"}`}
                aria-hidden
              />
              <span className={`mt-2 block text-xs font-semibold sm:text-sm ${i <= step ? "text-navy" : "text-muted"}`}>
                <span className="hidden sm:inline">{i + 1}. </span>
                {s}
              </span>
            </li>
          ))}
        </ol>

        <div className="panel mt-6 p-5 sm:p-7">
          {step === 0 && (
            <Section title="Your details" hint="Your advisor and the co-op office will use these to contact you.">
              <ReadOnly label="Student ID" value={session.id} />
              <Field label="Full name" required error={errors.name}>
                {(p) => <input {...p} className="field" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />}
              </Field>
              <Field label="Faculty">
                {(p) => (
                  <select {...p} className="field" value={details.faculty} onChange={(e) => setDetails({ ...details, faculty: e.target.value })}>
                    {FACULTIES.map((f) => (
                      <option key={f} value={f}>
                        {FACULTY_INFO[f].code} · {f}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Major" required error={errors.major}>
                {(p) => <input {...p} className="field" value={details.major} onChange={(e) => setDetails({ ...details, major: e.target.value })} />}
              </Field>
              <Field label="Year">
                {(p) => (
                  <select {...p} className="field" value={details.year} onChange={(e) => setDetails({ ...details, year: e.target.value })}>
                    {["2", "3", "4", "5"].map((y) => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="GPA" hint="Optional" error={errors.gpa}>
                {(p) => <input {...p} className="field" inputMode="decimal" placeholder="e.g. 3.25" value={details.gpa} onChange={(e) => setDetails({ ...details, gpa: e.target.value })} />}
              </Field>
              <Field label="Phone" required error={errors.phone}>
                {(p) => <input {...p} className="field" type="tel" placeholder="081 234 5678" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} />}
              </Field>
              <Field label="Email" required error={errors.email} wide>
                {(p) => <input {...p} className="field" type="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />}
              </Field>
            </Section>
          )}

          {step === 1 && (
            <Section title="Skills" hint="Tell your advisor and the company a little about you.">
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-sm font-semibold text-navy">English</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {language.map((l, i) => (
                    <label key={l.skill} className="flex items-center justify-between gap-3 rounded-xl border border-rule px-3 py-2">
                      <span className="text-sm text-body">{l.skill}</span>
                      <select
                        className="field h-9 w-36 text-sm"
                        value={l.level}
                        onChange={(e) => setLanguage(language.map((x, j) => (j === i ? { ...x, level: e.target.value } : x)))}
                      >
                        {LEVELS.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field label="Activities and experience" hint="One per line" wide>
                {(p) => <textarea {...p} rows={4} className="field h-auto py-2.5" placeholder="e.g. Programming club member" value={activities} onChange={(e) => setActivities(e.target.value)} />}
              </Field>
              <Field label="Why do you want this place?" required error={errors.motivation} wide>
                {(p) => <textarea {...p} rows={4} className="field h-auto py-2.5" value={motivation} onChange={(e) => setMotivation(e.target.value)} />}
              </Field>
            </Section>
          )}

          {step === 2 && (
            <Section title="Documents" hint={`Attach each document this place asks for. PDF or image, up to ${MAX_MB} MB each.`}>
              <ul className="space-y-2.5 sm:col-span-2">
                {requiredDocs.map((d) => (
                  <DocUpload
                    key={d}
                    name={d}
                    file={files[d]}
                    error={errors[`doc:${d}`]}
                    onFile={(f) => setFiles((x) => ({ ...x, [d]: f }))}
                    onRemove={() =>
                      setFiles((x) => {
                        const n = { ...x };
                        delete n[d];
                        return n;
                      })
                    }
                  />
                ))}
              </ul>
              <p className="text-xs text-muted sm:col-span-2">
                Draft: files are not uploaded yet. Only their names are kept until the co-op system is connected.
              </p>
            </Section>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-navy">Check and send</h2>
              <p className="mt-1 text-sm text-muted">Your request goes to your advisor first. You can follow it on your page.</p>
              <dl className="mt-5 divide-y divide-rule rounded-xl border border-rule">
                {[
                  ["Student", `${details.name} · ${session.id}`],
                  ["Faculty", `${details.faculty} · ${details.major} · Year ${details.year}${details.gpa ? ` · GPA ${details.gpa}` : ""}`],
                  ["Contact", `${details.phone} · ${details.email}`],
                  ["English", language.map((l) => `${l.skill}: ${l.level}`).join(" · ")],
                  ["Activities", activities.split("\n").filter((a) => a.trim()).join(" · ") || "None"],
                  ["Why this place", motivation],
                ].map(([k, v]) => (
                  <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr]">
                    <dt className="text-sm text-muted">{k}</dt>
                    <dd className="text-[0.95rem] text-ink">{v}</dd>
                  </div>
                ))}
                <div className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr]">
                  <dt className="text-sm text-muted">Documents</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {requiredDocs.map((d) => (
                      <span key={d} className="inline-flex items-center gap-1 rounded-md bg-navy-50 px-2 py-1 text-xs font-medium text-navy">
                        <Paperclip className="size-3" aria-hidden /> {d}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-[#fafbfd] p-4 text-sm text-body">
                <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-0.5 size-4" />
                I confirm these details are correct, and I agree to do my co-op at this place if I am accepted.
              </label>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-rule pt-5">
            {step > 0 ? (
              <button type="button" onClick={() => setStep((n) => n - 1)} className="btn-secondary h-11 text-sm" disabled={sending}>
                <ArrowLeft className="size-4" aria-hidden /> Back
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="btn-primary h-11 text-sm">
                Next: {STEPS[step + 1]} <ArrowRight className="size-4" aria-hidden />
              </button>
            ) : (
              <button type="button" onClick={send} disabled={!confirm || sending} className="btn-primary h-11 text-sm">
                {sending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
                {sending ? "Sending…" : "Send to advisor"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function DocUpload({
  name,
  file,
  error,
  onFile,
  onRemove,
}: {
  name: string;
  file?: AppDocument;
  error?: string;
  onFile: (f: AppDocument) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const [tooBig, setTooBig] = useState(false);
  return (
    <li className={`rounded-xl border p-3.5 ${file ? "border-success/40 bg-[#f1faf5]" : error || tooBig ? "border-danger/50" : "border-rule"}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${file ? "bg-success text-white" : "bg-navy-50 text-navy"}`}>
          {file ? <Check className="size-4" strokeWidth={3} aria-hidden /> : <FileText className="size-4" aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-ink">{name}</span>
          <span className="block truncate text-sm text-muted">
            {file ? `${file.file} · ${fmtSize(file.size)}` : "Not attached yet"}
          </span>
        </span>
        {file ? (
          <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-muted hover:bg-white hover:text-danger">
            <X className="size-4" aria-hidden /> Remove
          </button>
        ) : (
          <label htmlFor={id} className="btn-secondary h-9 cursor-pointer text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-navy-600">
            <Upload className="size-4" aria-hidden /> Choose file
            <input
              id={id}
              type="file"
              accept=".pdf,image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > MAX_MB * 1024 * 1024) {
                  setTooBig(true);
                  return;
                }
                setTooBig(false);
                onFile({ name, file: f.name, size: f.size });
              }}
            />
          </label>
        )}
      </div>
      {(error || tooBig) && !file && (
        <p className="mt-2 text-sm text-danger">{tooBig ? `This file is over ${MAX_MB} MB. Choose a smaller one.` : error}</p>
      )}
    </li>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-navy">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-navy">{label}</span>
      <span className="tabular flex h-[2.9rem] items-center rounded-[10px] border border-rule bg-[#f1f3f7] px-3 text-muted">{value}</span>
    </div>
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
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={id} className="text-sm font-semibold text-navy">
        {label}
        {required && <span className="text-danger"> *</span>}
        {hint && <span className="ml-2 font-normal text-muted">{hint}</span>}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${id}-e` : undefined })}
      {error && (
        <p id={`${id}-e`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
