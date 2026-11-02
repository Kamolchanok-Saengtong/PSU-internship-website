import { runReminders } from "@/server/reminders";

/**
 * Send due deadline reminders. Call once a day from a scheduler, e.g. Vercel Cron
 * (vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 1 * * *" }] }).
 *
 * In production, set CRON_SECRET; callers must send "Authorization: Bearer <CRON_SECRET>".
 * In development it runs without a secret so you can test from /dev/outbox.
 */
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  const prod = process.env.NODE_ENV === "production";
  // Production with no secret set: refuse everyone, rather than run unprotected.
  const allowed = secret ? req.headers.get("authorization") === `Bearer ${secret}` : !prod;
  if (!allowed) return Response.json({ error: "Not allowed." }, { status: 401 });
  const baseUrl = process.env.APP_URL ?? new URL(req.url).origin;
  return Response.json(await runReminders({ baseUrl }));
}

export const GET = handle;
export const POST = handle;
