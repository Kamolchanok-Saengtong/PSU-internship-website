import { promises as fs } from "fs";
import path from "path";
import { UPLOAD_DIR, listResources } from "@/server/db";

/** Download a resource's file under its original name. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = (await listResources()).find((x) => x.id === id);
  if (!r?.file) return Response.json({ error: "No file." }, { status: 404 });
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, path.basename(r.file.stored)));
    const name = encodeURIComponent(r.file.name);
    return new Response(data, {
      headers: {
        "Content-Type": r.file.type,
        "Content-Length": String(data.length),
        "Content-Disposition": `attachment; filename*=UTF-8''${name}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "The file is missing." }, { status: 404 });
  }
}
