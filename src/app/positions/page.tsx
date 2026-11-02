import type { Metadata } from "next";
import { Board } from "@/components/board";
import { facultyFromSlug } from "@/lib/faculties";
import { typeFromSlug } from "@/lib/placement";
import { PROVINCES } from "@/lib/types";

export const metadata: Metadata = { title: "All positions" };

export default async function PositionsPage({
  searchParams,
}: {
  searchParams: Promise<{ faculty?: string; province?: string; type?: string; q?: string }>;
}) {
  const { faculty, province, type, q } = await searchParams;
  const initialFaculty = facultyFromSlug(faculty);
  const initialProvince = PROVINCES.find((p) => p === province);
  const initialType = typeFromSlug(type);
  return (
    <Board
      key={`${initialFaculty ?? ""}|${initialProvince ?? ""}|${initialType ?? ""}|${q ?? ""}`}
      initialFaculty={initialFaculty}
      initialProvince={initialProvince}
      initialType={initialType}
      initialQuery={q ?? ""}
    />
  );
}
