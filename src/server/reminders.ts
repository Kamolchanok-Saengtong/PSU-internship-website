import { SAMPLE_PLACES } from "@/lib/sample-data";
import { defaultAccountEmail } from "@/lib/reminders";
import { allowanceText, daysLeft, longDate } from "@/lib/status";
import { placeLocation } from "@/lib/placement";
import type { Place } from "@/lib/types";
import { studentsWithReminders, updateStudent } from "./db";
import { sendEmail } from "./mailer";

/**
 * Places the reminder job knows about.
 * NOTE: staff edits are still saved in the browser only, so the server uses the
 * listed places. When places move to the database, read them from there here.
 */
async function getPlaces(): Promise<Place[]> {
  return SAMPLE_PLACES;
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function reminderEmail(place: Place, days: number, baseUrl: string) {
  const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
  const url = `${baseUrl}/places/${place.id}`;
  const docs = place.documents ?? [];
  const subject = `Reminder: ${place.role} closes ${when}`;
  const text = [
    `Applications for ${place.role} at ${place.company} close ${when} (${longDate(place.closes)}).`,
    ``,
    `Where: ${placeLocation(place)}`,
    `Pay: ${allowanceText(place.allowance, place.payPer)}`,
    docs.length ? `Documents to prepare: ${docs.join(", ")}` : "",
    ``,
    `See the place: ${url}`,
    ``,
    `You get this email because you turned on reminders for this saved place on the PSU Phuket Internship Board.`,
  ]
    .filter((l) => l !== "")
    .join("\n");
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#1f2b45">
  <p style="color:#5b6782;margin:0 0 4px">PSU Phuket Internship Board</p>
  <h1 style="color:#203669;font-size:22px;margin:0 0 12px">${escape(place.role)} closes ${when}</h1>
  <p style="margin:0 0 16px">${escape(place.company)} · ${escape(placeLocation(place))}<br>Applications close <strong>${escape(longDate(place.closes))}</strong>.</p>
  ${docs.length ? `<p style="margin:0 0 6px"><strong>Documents to prepare</strong></p><ul style="margin:0 0 16px">${docs.map((d) => `<li>${escape(d)}</li>`).join("")}</ul>` : ""}
  <p><a href="${url}" style="display:inline-block;background:#203669;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">See the place</a></p>
  <p style="color:#5b6782;font-size:12px;margin-top:24px">You get this email because you turned on reminders for this saved place. Turn them off on your page.</p>
</div>`;
  return { subject, text, html };
}

/**
 * Send every reminder that is due. Safe to run as often as you like: each
 * reminder (place × days-before) is sent at most once.
 * Run it once a day, e.g. with a cron job calling /api/cron/reminders.
 */
export async function runReminders({ baseUrl, now = new Date() }: { baseUrl: string; now?: Date }) {
  const places = await getPlaces();
  const results: { studentId: string; placeId: string; to: string; days: number; via: string }[] = [];
  const errors: string[] = [];

  for (const [studentId, student] of await studentsWithReminders()) {
    for (const [placeId, r] of Object.entries(student.reminders)) {
      if (!r.enabled || !student.saved.includes(placeId)) continue;
      const place = places.find((p) => p.id === placeId);
      if (!place) continue;
      const left = daysLeft(place.closes, now);
      if (left < 0) continue;

      // Due: the deadline is within N days and that N hasn't been sent. If several are due
      // at once (reminder turned on late), send one email and mark them all as done.
      const due = r.daysBefore.filter((n) => left <= n && !r.sent[String(n)]);
      if (!due.length) continue;

      const to = r.useAccountEmail || !r.email ? student.email || defaultAccountEmail(studentId) : r.email;
      try {
        const { via } = await sendEmail({ to, ...reminderEmail(place, left, baseUrl) });
        const at = now.toISOString();
        await updateStudent(studentId, (s) => {
          const cur = s.reminders[placeId];
          if (cur) for (const n of due) cur.sent[String(n)] = at;
        });
        results.push({ studentId, placeId, to, days: left, via });
      } catch (e) {
        errors.push(`${studentId}/${placeId}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
  return { sent: results.length, results, errors };
}
