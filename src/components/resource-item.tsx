import { BookOpen, Download, ExternalLink, FileText, Megaphone, Pin } from "lucide-react";
import { FACULTY_INFO } from "@/lib/faculties";
import { KIND_INFO, PROGRAM_LABEL, fileExt, fmtSize, type ResourceKind } from "@/lib/resources";
import { fileUrl, type PublicResource } from "@/lib/resources-client";
import type { Faculty } from "@/lib/types";

export const KIND_ICON: Record<ResourceKind, typeof FileText> = { announcement: Megaphone, form: FileText, guide: BookOpen };
const KIND_TONE: Record<ResourceKind, string> = {
  announcement: "bg-gold-soft text-gold-ink",
  form: "bg-[#eef6ff] text-[#1d5fa8]",
  guide: "bg-[#e9f7ef] text-[#0b6b40]",
};

/** "ไทย (English)" → { main: "English", sub: "ไทย" }; anything else stays as it is. */
export function splitTitle(title: string): { main: string; sub?: string } {
  const m = title.match(/^(.*[฀-๿].*?)\s*\(([^()]*[A-Za-z][^()]*)\)\s*$/);
  return m ? { main: m[2].trim(), sub: m[1].trim() } : { main: title };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

export function KindTag({ kind }: { kind: ResourceKind }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[0.72rem] font-semibold tracking-wide uppercase ${KIND_TONE[kind]}`}>
      {KIND_INFO[kind].label}
    </span>
  );
}

/** The main action: download the uploaded file, or open the link. */
export function ResourceAction({ r, compact = false }: { r: PublicResource; compact?: boolean }) {
  if (r.file) {
    return (
      <a href={fileUrl(r.id)} className={compact ? "btn-secondary h-9 text-sm" : "btn-primary h-10 text-sm"}>
        <Download className="size-4" aria-hidden />
        Download
        <span className="font-normal opacity-80">
          {fileExt(r.file.name).toUpperCase()} · {fmtSize(r.file.size)}
        </span>
      </a>
    );
  }
  if (r.link) {
    const host = new URL(r.link).hostname.replace(/^www\./, "");
    return (
      <a href={r.link} target="_blank" rel="noopener noreferrer" className={compact ? "btn-secondary h-9 text-sm" : "btn-secondary h-10 text-sm"}>
        <ExternalLink className="size-4" aria-hidden /> Open
        <span className="font-normal text-muted">{host}</span>
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }
  return <span className="text-sm text-muted">File coming soon</span>;
}

export function ResourceRow({ r }: { r: PublicResource }) {
  const Icon = KIND_ICON[r.kind];
  const t = splitTitle(r.title);
  return (
    <li className="flex flex-wrap items-start gap-4 p-4 sm:flex-nowrap sm:p-5">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${KIND_TONE[r.kind]}`}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 basis-[calc(100%-4rem)] sm:basis-0">
        <div className="flex flex-wrap items-center gap-2">
          <KindTag kind={r.kind} />
          {r.pinned && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy">
              <Pin className="size-3" aria-hidden /> Pinned
            </span>
          )}
        </div>
        <h3 className="mt-1.5 leading-snug font-semibold text-navy">{t.main}</h3>
        {t.sub && (
          <p className="mt-0.5 text-sm text-muted" lang="th">
            {t.sub}
          </p>
        )}
        {r.summary && <p className="mt-1.5 text-[0.95rem] text-body">{r.summary}</p>}
        <p className="mt-2 text-xs text-muted">
          {PROGRAM_LABEL[r.program]} · {r.faculty === "all" ? "All faculties" : (FACULTY_INFO[r.faculty as Faculty]?.code ?? r.faculty)} · {day(r.published)}
        </p>
      </div>
      <div className="w-full shrink-0 sm:w-auto sm:pt-1">
        <ResourceAction r={r} />
      </div>
    </li>
  );
}
