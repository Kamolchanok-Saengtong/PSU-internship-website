import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DevOutbox } from "@/components/dev-outbox";

export const metadata: Metadata = { title: "Dev outbox" };

export default function DevOutboxPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DevOutbox />;
}
