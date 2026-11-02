import { addToOutbox } from "./db";

export type Email = { to: string; subject: string; text: string; html: string };

/**
 * Send an email.
 *
 * - With RESEND_API_KEY and EMAIL_FROM set: sends for real through Resend
 *   (https://resend.com). Swap in another provider by changing this function.
 * - Without them (local development): nothing is sent. The email is saved to
 *   the dev outbox, which you can read at /dev/outbox.
 */
export async function sendEmail(email: Email): Promise<{ via: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  let via = "dev outbox (not sent)";

  if (key && from) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: email.to, subject: email.subject, text: email.text, html: email.html }),
    });
    if (!res.ok) throw new Error(`Email failed (${res.status}): ${await res.text()}`);
    via = "resend";
  }

  await addToOutbox({ ...email, id: crypto.randomUUID(), at: new Date().toISOString(), via });
  return { via };
}
