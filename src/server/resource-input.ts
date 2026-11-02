import { promises as fs } from "fs";
import path from "path";
import { FACULTIES } from "@/lib/types";
import {
  MAX_UPLOAD_MB,
  PROGRAMS,
  RESOURCE_KINDS,
  UPLOAD_TYPES,
  fileExt,
  isHttpUrl,
  type Resource,
  type ResourceFile,
  type ResourceInput,
} from "@/lib/resources";
import { UPLOAD_DIR } from "./db";

/** Read and check the staff form (multipart). Returns the fields, the file, or an error message. */
export async function readResourceForm(
  req: Request,
): Promise<{ error: string } | { input: ResourceInput; file: File | null; removeFile: boolean }> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return { error: "Send the form as multipart/form-data." };
  }
  const str = (k: string) => String(form.get(k) ?? "").trim();
  const title = str("title");
  const kind = str("kind") as Resource["kind"];
  const program = str("program") as Resource["program"];
  const faculty = str("faculty") || "all";
  const link = str("link");
  const file = form.get("file");

  if (!title || title.length > 300) return { error: "Enter a title (up to 300 characters)." };
  if (!RESOURCE_KINDS.includes(kind)) return { error: "Choose a type." };
  if (!PROGRAMS.includes(program)) return { error: "Choose who it is for." };
  if (faculty !== "all" && !(FACULTIES as readonly string[]).includes(faculty)) return { error: "Choose a faculty." };
  if (link && !isHttpUrl(link)) return { error: "The link must start with http:// or https://." };

  let upload: File | null = null;
  if (file instanceof File && file.size > 0) {
    if (!UPLOAD_TYPES[fileExt(file.name)]) return { error: "Upload a PDF, Word, Excel, PowerPoint or image file." };
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return { error: `The file must be ${MAX_UPLOAD_MB} MB or smaller.` };
    upload = file;
  }

  return {
    input: {
      title,
      summary: str("summary").slice(0, 600) || undefined,
      kind,
      program,
      faculty,
      link: link || undefined,
      pinned: form.get("pinned") === "true",
    },
    file: upload,
    removeFile: form.get("removeFile") === "true",
  };
}

/** Save an upload under a name we choose (never the user's), and describe it. */
export async function storeUpload(id: string, file: File): Promise<ResourceFile> {
  const ext = fileExt(file.name);
  const stored = `${id}-${crypto.randomUUID()}.${ext}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, stored), Buffer.from(await file.arrayBuffer()));
  return { name: path.basename(file.name).slice(0, 200), size: file.size, type: UPLOAD_TYPES[ext], stored };
}

export async function deleteUpload(f: ResourceFile | undefined) {
  if (f) await fs.rm(path.join(UPLOAD_DIR, path.basename(f.stored)), { force: true });
}

/** What the browser gets: everything except where the file is stored. */
export const publicResource = ({ file, ...r }: Resource) => ({
  ...r,
  file: file ? { name: file.name, size: file.size, type: file.type } : undefined,
});
