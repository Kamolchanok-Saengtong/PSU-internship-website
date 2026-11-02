import type { Metadata } from "next";
import { StaffGate } from "@/components/staff-gate";
import { StaffTabs } from "@/components/staff-tabs";

export const metadata: Metadata = { title: "Staff" };

export default function AdminPage() {
  return (
    <StaffGate>
      <StaffTabs />
    </StaffGate>
  );
}
