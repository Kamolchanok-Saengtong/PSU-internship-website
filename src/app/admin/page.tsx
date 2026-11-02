import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin-panel";
import { StaffGate } from "@/components/staff-gate";

export const metadata: Metadata = { title: "Staff" };

export default function AdminPage() {
  return (
    <StaffGate>
      <AdminPanel />
    </StaffGate>
  );
}
