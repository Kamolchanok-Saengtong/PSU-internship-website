import { listResources, updateResources } from "@/server/db";
import { publicResource, readResourceForm, storeUpload } from "@/server/resource-input";
import { badRequest, getStaffId, staffOnly } from "@/server/session";

const order = (a: { pinned: boolean; published: string }, b: { pinned: boolean; published: string }) =>
  Number(b.pinned) - Number(a.pinned) || b.published.localeCompare(a.published);

/** Everyone: all news and documents, pinned first, newest first. */
export async function GET() {
  const list = await listResources();
  return Response.json({ resources: [...list].sort(order).map(publicResource) });
}

/** Staff: add one. multipart/form-data with title, kind, program, faculty, summary?, link?, file?, pinned. */
export async function POST(req: Request) {
  if (!getStaffId(req)) return staffOnly();
  const form = await readResourceForm(req);
  if ("error" in form) return badRequest(form.error);
  if (!form.input.link && !form.file && form.input.kind !== "announcement") {
    return badRequest("Add a link or upload a file.");
  }
  const id = `r-${Date.now().toString(36)}`;
  const file = form.file ? await storeUpload(id, form.file) : undefined;
  const now = new Date().toISOString();
  const created = await updateResources((list) => {
    const r = { ...form.input, id, file, published: now, updated: now };
    list.unshift(r);
    return r;
  });
  return Response.json({ resource: publicResource(created) }, { status: 201 });
}
