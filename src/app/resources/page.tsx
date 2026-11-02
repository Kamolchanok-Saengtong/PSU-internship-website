import type { Metadata } from "next";
import { ResourcesPage } from "@/components/resources-page";

export const metadata: Metadata = { title: "News & documents" };

export default function Resources() {
  return <ResourcesPage />;
}
