"use client";

import Link from "next/link";
import { ArrowRight, Send } from "lucide-react";
import { CAN_APPLY, STATUS_INFO, useMyApplication } from "@/lib/application";
import { useSession } from "@/lib/auth";
import { StatusPill } from "./application-panel";

/** The main action on a co-op place page. */
export function ApplyButton({ placeId, closed }: { placeId: string; closed: boolean }) {
  const session = useSession("student");
  const app = useMyApplication(session?.id);
  const href = `/apply/${placeId}`;

  if (app && app.placeId === placeId && !CAN_APPLY.includes(app.status)) {
    return (
      <div className="rounded-xl border border-rule bg-[#fafbfd] p-3.5">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-navy">
          You applied here <StatusPill status={app.status} />
        </p>
        <p className="mt-1 text-sm text-body">{STATUS_INFO[app.status].en}</p>
        <Link href="/me" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-navy-600 hover:underline">
          Follow your request <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }
  if (closed) return null;
  if (app && !CAN_APPLY.includes(app.status)) {
    return (
      <div className="rounded-xl border border-rule bg-[#fafbfd] p-3.5 text-sm text-body">
        You already have a co-op request in progress (<StatusPill status={app.status} />). You can choose another place if it is
        declined.{" "}
        <Link href="/me" className="font-semibold text-navy-600 hover:underline">
          See your request
        </Link>
      </div>
    );
  }
  if (!session) {
    return (
      <Link href={`/signin?next=${encodeURIComponent(href)}`} className="btn-primary w-full">
        <Send className="size-4" aria-hidden /> Sign in to apply for co-op
      </Link>
    );
  }
  return (
    <Link href={href} className="btn-primary w-full">
      <Send className="size-4" aria-hidden /> {app && app.status !== "cancel" ? "Choose this place instead" : "Apply for co-op"}
    </Link>
  );
}
