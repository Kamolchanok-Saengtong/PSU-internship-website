"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CircleCheck, Loader2, Paperclip, Pencil, Pin, Plus, Trash2, Upload, X } from "lucide-react";
import { FACULTY_INFO } from "@/lib/faculties";
import { KIND_INFO, MAX_UPLOAD_MB, PROGRAMS, PROGRAM_LABEL, RESOURCE_KINDS, UPLOAD_TYPES, fileExt, fmtSize } from "@/lib/resources";
import { createResource, deleteResource, updateResource, useResources, type PublicResource } from "@/lib/resources-client";
import { FACULTIES } from "@/lib/types";
import { KindTag, splitTitle } from "./resource-item";

/** Staff: add, edit and remove news, announcements, forms and guides. */
export function StaffResources() {
  const { list } = useResources();
  const [editing, setEditing] = useState<PublicResource | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const say = (t: string) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 4000);
  };

  return (
    <>
      <section className="hero-band">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 pt-10 pb-8 sm:px-6 sm:pt-12">
          <div>
            <h1 className="text-[clamp(1.9rem,4vw,2.5rem)] leading-tight font-bold tracking-[-0.02em] text-navy">News &amp; documents</h1>
            <p className="mt-1 text-body">Announcements, forms and guides students see on the News &amp; docs page.</p>
          </div>
          <button type="button" onClick={() => setEditing("new")} className="btn-primary h-11 text-sm">
            <Plus className="size-4" aria-hidden /> Add
          </button>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="panel overflow-hidden" aria-label="News and documents">
          {list === null ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-navy-50" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <p className="px-6 py-14 text-center text-muted">Nothing yet. Press Add to post the first one.</p>
          ) : (
            <ul className="divide-y divide-rule">
              {list.map((r) => {
                const t = splitTitle(r.title);
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3.5">
                    <div className="min-w-[16rem] flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <KindTag kind={r.kind} />
                        {r.pinned && <Pin className="size-3.5 text-navy" aria-label="Pinned" />}
                        <span className="text-xs text-muted">
                          {PROGRAM_LABEL[r.program]} · {r.faculty === "all" ? "All faculties" : (FACULTY_INFO[r.faculty as keyof typeof FACULTY_INFO]?.code ?? r.faculty)}
                        </span>
                      </div>
                      <p className="mt-1 font-semibold text-navy">{t.main}</p>
                    </div>
                    <div className="text-sm text-muted">
                      {r.file ? (
                        <span className="inline-flex items-center gap-1">
                          <Paperclip className="size-3.5" aria-hidden /> {r.file.name}
                        </span>
                      ) : r.link ? (
                        new URL(r.link).hostname.replace(/^www\./, "")
                      ) : (
                        <span className="font-medium text-gold-ink">No file yet</span>
                      )}
                    </div>
                    {confirmDelete === r.id ? (
                      <span className="flex items-center gap-2 text-sm" role="alert">
                        Delete?
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteResource(r.id);
                            setConfirmDelete(null);
                            say("Deleted.");
                          }}
                          className="btn-danger h-9 text-sm"
                        >
                          Delete
                        </button>
                        <button type="button" onClick={() => setConfirmDelete(null)} className="btn-secondary h-9 text-sm">
                          Keep
                        </button>
                      </span>
                    ) : (
                      <span className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(r)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-navy hover:bg-navy-50"
                        >
                          <Pencil className="size-3.5" aria-hidden /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(r.id)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-danger hover:bg-[#fdf1f0]"
                        >
                          <Trash2 className="size-3.5" aria-hidden /> Delete
                        </button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <p className="mt-4 text-sm text-muted">
          Files are stored on the server (in development: the .data/uploads folder). Links can point to Google Drive or Google
          Forms.
        </p>
      </div>

      {editing && (
        <ResourceDrawer
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(t) => {
            setEditing(null);
            say(t);
          }}
        />
      )}

      {toast && (
        <div role="status" className="toast fixed right-4 bottom-4 z-[70] flex items-center gap-3 rounded-xl bg-navy-950 px-4 py-3 text-sm text-white shadow-[0_18px_40px_-16px_rgb(15_27_56/0.7)]">
          <CircleCheck className="size-4 text-gold" aria-hidden /> {toast}
        </div>
      )}
    </>
  );
}

function ResourceDrawer({
  initial,
  onClose,
  onSaved,
}: {
  initial: PublicResource | null;
  onClose: () => void;
  onSaved: (text: string) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [kind, setKind] = useState(initial?.kind ?? "announcement");
  const [program, setProgram] = useState(initial?.program ?? "both");
  const [faculty, setFaculty] = useState(initial?.faculty ?? "all");
  const [link, setLink] = useState(initial?.link ?? "");
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [file, setFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const fileId = useId();

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>("input, textarea, select")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = overflow;
      prev?.focus();
    };
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Enter a title.");
    const form = new FormData();
    form.set("title", title);
    form.set("summary", summary);
    form.set("kind", kind);
    form.set("program", program);
    form.set("faculty", faculty);
    form.set("link", link);
    form.set("pinned", String(pinned));
    if (file) form.set("file", file);
    if (removeFile) form.set("removeFile", "true");
    setBusy(true);
    try {
      if (initial) await updateResource(initial.id, form);
      else await createResource(form);
      onSaved(initial ? "Saved." : "Posted. Students can see it now.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      setBusy(false);
    }
  }

  const existingFile = initial?.file && !removeFile && !file ? initial.file : null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="presentation">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="drawer-backdrop absolute inset-0 bg-navy-950/40 backdrop-blur-[2px]" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={initial ? "Edit news or document" : "Add news or document"}
        data-lenis-prevent
        className="drawer-panel relative flex h-full w-full max-w-xl flex-col bg-ground shadow-[-24px_0_60px_-20px_rgb(15_27_56/0.45)]"
      >
        <header className="flex items-center justify-between gap-4 border-b border-rule bg-white px-5 py-4 sm:px-7">
          <h2 className="text-xl font-bold text-navy">{initial ? "Edit" : "Add news or document"}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-navy-50 hover:text-navy">
            <X className="size-5" aria-hidden />
            <span className="sr-only">Close</span>
          </button>
        </header>

        <form id="resource-form" onSubmit={submit} noValidate className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-navy">
              Title <span className="text-danger">*</span>
            </span>
            <span className="mb-1.5 block text-xs text-muted">Tip: “ไทย (English)” shows the English as the main title.</span>
            <textarea rows={2} value={title} onChange={(e) => setTitle(e.target.value)} className="field h-auto py-2.5" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-navy">Short description</span>
            <textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} className="field h-auto py-2.5" />
          </label>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-navy">Type</legend>
            <div className="flex flex-wrap gap-2">
              {RESOURCE_KINDS.map((k) => (
                <label
                  key={k}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-navy-600 ${
                    kind === k ? "border-navy bg-navy text-white" : "border-rule bg-white text-body hover:border-navy-200"
                  }`}
                >
                  <input type="radio" name="kind" className="sr-only" checked={kind === k} onChange={() => setKind(k)} />
                  {KIND_INFO[k].label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-navy">For</span>
              <select value={program} onChange={(e) => setProgram(e.target.value as typeof program)} className="field">
                {PROGRAMS.map((p) => (
                  <option key={p} value={p}>
                    {PROGRAM_LABEL[p]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-navy">Faculty</span>
              <select value={faculty} onChange={(e) => setFaculty(e.target.value)} className="field">
                <option value="all">All faculties</option>
                {FACULTIES.map((f) => (
                  <option key={f} value={f}>
                    {FACULTY_INFO[f].code} · {f}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="panel space-y-4 p-4">
            <p className="text-sm font-semibold text-navy">Link or file</p>
            <label className="block">
              <span className="mb-1.5 block text-sm text-body">Link (Google Drive, Google Forms…)</span>
              <input type="url" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} className="field" />
            </label>
            <div>
              <span className="mb-1.5 block text-sm text-body">
                Or upload a file <span className="text-muted">(PDF, Word, Excel, PowerPoint or image, up to {MAX_UPLOAD_MB} MB)</span>
              </span>
              {existingFile ? (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rule bg-white px-3 py-2.5 text-sm">
                  <Paperclip className="size-4 text-muted" aria-hidden />
                  <span className="flex-1 text-ink">
                    {existingFile.name} <span className="text-muted">· {fmtSize(existingFile.size)}</span>
                  </span>
                  <label htmlFor={fileId} className="cursor-pointer font-semibold text-navy-600 hover:underline">
                    Replace
                  </label>
                  <button type="button" onClick={() => setRemoveFile(true)} className="font-semibold text-danger hover:underline">
                    Remove
                  </button>
                </div>
              ) : file ? (
                <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-[#f1faf5] px-3 py-2.5 text-sm">
                  <Paperclip className="size-4 text-success" aria-hidden />
                  <span className="flex-1 text-ink">
                    {file.name} <span className="text-muted">· {fmtSize(file.size)}</span>
                  </span>
                  <button type="button" onClick={() => setFile(null)} className="font-semibold text-muted hover:text-danger">
                    Remove
                  </button>
                </div>
              ) : (
                <label htmlFor={fileId} className="btn-secondary h-10 cursor-pointer text-sm has-[:focus-visible]:outline-2">
                  <Upload className="size-4" aria-hidden /> Choose file
                </label>
              )}
              <input
                id={fileId}
                type="file"
                className="sr-only"
                accept={Object.keys(UPLOAD_TYPES)
                  .map((x) => `.${x}`)
                  .join(",")}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  if (!UPLOAD_TYPES[fileExt(f.name)]) return setError("Upload a PDF, Word, Excel, PowerPoint or image file.");
                  if (f.size > MAX_UPLOAD_MB * 1024 * 1024) return setError(`The file must be ${MAX_UPLOAD_MB} MB or smaller.`);
                  setError("");
                  setFile(f);
                  setRemoveFile(false);
                }}
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-rule bg-white px-4 py-3">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="size-4" />
            <span>
              <span className="block text-sm font-semibold text-navy">Pin to “Read these first”</span>
              <span className="block text-xs text-muted">Pinned items show at the top and on students&apos; pages.</span>
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-[#fdf1f0] px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </form>

        <footer className="flex justify-end gap-2 border-t border-rule bg-white px-5 py-3.5 sm:px-7">
          <button type="button" onClick={onClose} className="btn-secondary h-10 text-sm" disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="resource-form" className="btn-primary h-10 text-sm" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} {initial ? "Save changes" : "Post"}
          </button>
        </footer>
      </div>
    </div>
  );
}
