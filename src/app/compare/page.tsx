import type { Metadata } from "next";
import { CompareTable } from "@/components/compare-table";

export const metadata: Metadata = { title: "Compare places" };

export default function ComparePage() {
  return <CompareTable />;
}
