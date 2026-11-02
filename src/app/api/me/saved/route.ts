import { getStudent, updateStudent } from "@/server/db";
import { badRequest, getStudentId, unauthorized } from "@/server/session";

/** Save or unsave one place. Body: { placeId, saved }. Unsaving also stops its reminder. */
export async function PUT(req: Request) {
  const id = getStudentId(req);
  if (!id) return unauthorized();
  const { placeId, saved } = (await req.json().catch(() => ({}))) as { placeId?: string; saved?: boolean };
  if (!placeId || typeof saved !== "boolean") return badRequest("Send { placeId, saved }.");
  const s = await updateStudent(id, (s) => {
    s.saved = s.saved.filter((x) => x !== placeId);
    if (saved) s.saved.unshift(placeId);
    else delete s.reminders[placeId];
  });
  return Response.json({ saved: s.saved });
}

/** Add several places at once (used once to move older browser-only saves). Body: { ids }. */
export async function POST(req: Request) {
  const id = getStudentId(req);
  if (!id) return unauthorized();
  const { ids } = (await req.json().catch(() => ({}))) as { ids?: string[] };
  if (!Array.isArray(ids)) return badRequest("Send { ids: [...] }.");
  const s = await updateStudent(id, (s) => {
    for (const x of ids) if (typeof x === "string" && !s.saved.includes(x)) s.saved.push(x);
  });
  return Response.json({ saved: s.saved });
}

export async function GET(req: Request) {
  const id = getStudentId(req);
  if (!id) return unauthorized();
  return Response.json({ saved: (await getStudent(id)).saved });
}
