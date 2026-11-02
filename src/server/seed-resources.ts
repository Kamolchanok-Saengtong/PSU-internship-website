import type { Resource } from "@/lib/resources";

/**
 * SAMPLE starting items for the draft. Titles are made up and every link points
 * to example.com, a placeholder: the real university documents and forms are
 * for PSU only and must not be published in this repository. Staff add the real
 * ones from the Staff page (News & docs tab) once the site is deployed.
 */
const t = "2026-08-11T09:00:00.000Z";
export const SEED_RESOURCES: Resource[] = [
  {
    id: "sample-personal-info-guide",
    title: "ตัวอย่างการกรอกข้อมูลส่วนตัว (Sample: How to fill in your personal details)",
    summary: "Sample guide. Staff will replace this with the real document.",
    kind: "guide",
    program: "both",
    faculty: "all",
    link: "https://example.com/psu-sample/personal-details-guide",
    pinned: true,
    published: t,
    updated: t,
  },
  {
    id: "sample-system-manual",
    title: "คู่มือการใช้งานระบบสมัครสหกิจศึกษาและฝึกงาน (Sample: Online application user manual)",
    summary: "Sample guide. Staff will replace this with the real document.",
    kind: "guide",
    program: "both",
    faculty: "all",
    link: "https://example.com/psu-sample/user-manual",
    pinned: true,
    published: t,
    updated: t,
  },
  {
    id: "sample-internship-announcement",
    title: "ประกาศ เรื่องการออกฝึกงาน (Sample announcement: Internship period)",
    kind: "announcement",
    program: "internship",
    faculty: "all",
    pinned: false,
    published: t,
    updated: t,
  },
  {
    id: "sample-coop-announcement",
    title: "ประกาศ เรื่องการออกปฏิบัติงานสหกิจศึกษา (Sample announcement: Co-op period)",
    kind: "announcement",
    program: "coop",
    faculty: "all",
    pinned: false,
    published: t,
    updated: t,
  },
  {
    id: "sample-self-found-company-form",
    title: "แบบเสนองานสำหรับสถานประกอบการที่นักศึกษาหาเอง (Sample form: Company you found yourself)",
    summary: "Sample form. Staff will replace this with the real form link.",
    kind: "form",
    program: "both",
    faculty: "all",
    link: "https://example.com/psu-sample/self-found-company-form",
    pinned: false,
    published: t,
    updated: t,
  },
];
