import { getStudent, updateStudent } from "@/server/db";
import { badRequest, getStudentId, unauthorized } from "@/server/session";
import { defaultAccountEmail, isEmail, type MeResponse } from "@/lib/reminders";

const toResponse = (studentId: string, s: Awaited<ReturnType<typeof getStudent>>): MeResponse => ({
  studentId,
  accountEmail: s.email || defaultAccountEmail(studentId),
  saved: s.saved,
  reminders: s.reminders,
});

/** The signed-in student's saved places, reminders and email. */
export async function GET(req: Request) {
  const id = getStudentId(req);
  if (!id) return unauthorized();
  return Response.json(toResponse(id, await getStudent(id)));
}

/** Change the account email. Body: { email } ("" resets to the PSU default). */
export async function PATCH(req: Request) {
  const id = getStudentId(req);
  if (!id) return unauthorized();
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (typeof email !== "string" || (email && !isEmail(email))) return badRequest("Enter a valid email, like name@email.psu.ac.th.");
  const s = await updateStudent(id, (s) => {
    s.email = email.trim() || undefined;
  });
  return Response.json(toResponse(id, s));
}
