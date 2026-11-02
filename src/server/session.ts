/**
 * Who is calling the API.
 *
 * DRAFT: the browser sends the signed-in student ID in the `x-student-id`
 * header, so anyone could pretend to be anyone. When real sign-in (e.g. PSU
 * Passport) is added, replace this function to read the verified session
 * cookie or token instead. Every API route gets the student only from here.
 */
export function getStudentId(req: Request): string | null {
  const id = req.headers.get("x-student-id")?.trim();
  return id && /^[\w.@-]{1,40}$/.test(id) ? id : null;
}

export const unauthorized = () => Response.json({ error: "Sign in as a student first." }, { status: 401 });
export const badRequest = (error: string) => Response.json({ error }, { status: 400 });
