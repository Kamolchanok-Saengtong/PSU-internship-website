"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth";

/** Shows its children only to signed-in staff; everyone else goes to /login. */
export function StaffGate({ children }: { children: React.ReactNode }) {
  const session = useSession("staff");
  const router = useRouter();

  useEffect(() => {
    if (session === null) router.replace("/login?next=/admin");
  }, [session, router]);

  if (!session) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" aria-hidden /> Checking sign-in…
        </span>
      </div>
    );
  }
  return <>{children}</>;
}
