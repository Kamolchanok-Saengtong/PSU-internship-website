import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin-panel";

export const metadata: Metadata = { title: "Staff" };

export default function AdminPage() {
  return <AdminPanel />;
}
