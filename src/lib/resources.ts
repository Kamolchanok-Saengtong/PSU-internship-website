/** News, announcements, forms and guides from the university. Shared by browser and server. */

export const RESOURCE_KINDS = ["announcement", "form", "guide"] as const;
export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export const KIND_INFO: Record<ResourceKind, { label: string; plural: string }> = {
  announcement: { label: "Announcement", plural: "Announcements" },
  form: { label: "Form", plural: "Forms" },
  guide: { label: "Guide", plural: "Guides" },
};

export const PROGRAMS = ["coop", "internship", "both"] as const;
export type Program = (typeof PROGRAMS)[number];
export const PROGRAM_LABEL: Record<Program, string> = { coop: "Co-op", internship: "Internship", both: "Co-op & internship" };

export type ResourceFile = { name: string; size: number; type: string; stored: string };

export type Resource = {
  id: string;
  title: string;
  summary?: string;
  kind: ResourceKind;
  program: Program;
  /** A faculty name from FACULTIES, or "all". */
  faculty: string;
  link?: string;
  file?: ResourceFile;
  pinned: boolean;
  published: string;
  updated: string;
};

export type ResourceInput = Pick<Resource, "title" | "summary" | "kind" | "program" | "faculty" | "link" | "pinned">;

/** Allowed uploads: documents and images, up to 20 MB. */
export const UPLOAD_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};
export const MAX_UPLOAD_MB = 20;

export const fileExt = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";
export const isHttpUrl = (s: string) => /^https?:\/\/\S+$/i.test(s.trim());

export const fmtSize = (b: number) => (b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`);
