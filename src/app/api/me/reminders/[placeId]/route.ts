import { updateStudent } from "@/server/db";
import { badRequest, getStudentId, unauthorized } from "@/server/session";
import { REMINDER_DAYS, isEmail, type Reminder } from "@/lib/reminders";

/**
 * Turn an email reminder on or off for a saved place.
 * Body: { enabled, daysBefore: number[], useAccountEmail, email? }
 */
export async function PUT(req: Request, { params }: { params: Promise<{ placeId: string }> }) {
  const id = getStudentId(req);
  if (!id) return unauthorized();
  const { placeId } = await params;
  const body = (await req.json().catch(() => ({}))) as Partial<Reminder>;

  const enabled = body.enabled === true;
  const daysBefore = [...new Set((body.daysBefore ?? []).filter((n) => (REMINDER_DAYS as readonly number[]).includes(n)))].sort((a, b) => b - a);
  const useAccountEmail = body.useAccountEmail !== false;
  const email = body.email?.trim();
  if (enabled && !daysBefore.length) return badRequest("Choose at least one day to be reminded.");
  if (enabled && !useAccountEmail && (!email || !isEmail(email))) return badRequest("Enter a valid email, like name@gmail.com.");

  let notSaved = false;
  const s = await updateStudent(id, (s) => {
    if (!s.saved.includes(placeId)) {
      notSaved = true;
      return;
    }
    const prev = s.reminders[placeId];
    // Keep "already sent" marks only for days that are still chosen.
    const sent = Object.fromEntries(Object.entries(prev?.sent ?? {}).filter(([n]) => daysBefore.includes(Number(n))));
    s.reminders[placeId] = { enabled, daysBefore, useAccountEmail, email: useAccountEmail ? undefined : email, sent };
  });
  if (notSaved) return badRequest("Save the place first.");
  return Response.json({ reminder: s.reminders[placeId] });
}
