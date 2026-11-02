import { updateResources } from "@/server/db";
import { deleteUpload, publicResource, readResourceForm, storeUpload } from "@/server/resource-input";
import { badRequest, getStaffId, staffOnly } from "@/server/session";
import type { ResourceFile } from "@/lib/resources";

type Ctx = { params: Promise<{ id: string }> };

/** Staff: edit one. Same fields as POST; a new file replaces the old one, removeFile=true drops it. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!getStaffId(req)) return staffOnly();
  const { id } = await params;
  const form = await readResourceForm(req);
  if ("error" in form) return badRequest(form.error);
  const file = form.file ? await storeUpload(id, form.file) : undefined;

  let old: ResourceFile | undefined;
  const updated = await updateResources((list) => {
    const r = list.find((x) => x.id === id);
    if (!r) return null;
    old = file || form.removeFile ? r.file : undefined;
    Object.assign(r, form.input, { updated: new Date().toISOString() });
    if (file) r.file = file;
    else if (form.removeFile) delete r.file;
    if (!form.input.link) delete r.link;
    if (!form.input.summary) delete r.summary;
    return { ...r };
  });
  if (!updated) {
    await deleteUpload(file);
    return Response.json({ error: "Not found." }, { status: 404 });
  }
  await deleteUpload(old);
  return Response.json({ resource: publicResource(updated) });
}

/** Staff: delete one, and its file. */
export async function DELETE(req: Request, { params }: Ctx) {
  if (!getStaffId(req)) return staffOnly();
  const { id } = await params;
  const removed = await updateResources((list) => {
    const i = list.findIndex((x) => x.id === id);
    return i === -1 ? null : list.splice(i, 1)[0];
  });
  if (!removed) return Response.json({ error: "Not found." }, { status: 404 });
  await deleteUpload(removed.file);
  return Response.json({ ok: true });
}
