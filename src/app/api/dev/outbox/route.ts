import { readOutbox } from "@/server/db";

/** Emails the app has "sent", for checking them in development. */
export async function GET() {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json({ emails: await readOutbox() });
}
