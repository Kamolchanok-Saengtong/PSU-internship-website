"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bookmark, Lock, LogIn, LogOut, Menu, X } from "lucide-react";
import { signOut, useSession } from "@/lib/auth";

const NAV = [
  { href: "/positions", label: "Positions" },
  { href: "/map", label: "Map" },
  { href: "/compare", label: "Compare" },
  { href: "/resources", label: "News & docs" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the phone menu after navigating.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/positions" ? pathname.startsWith("/positions") || pathname.startsWith("/places") : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image src="/psu-emblem.svg" alt="" width={32} height={42} className="h-10 w-auto" priority />
          <span className="leading-tight">
            <span className="block text-[1.05rem] font-bold text-navy">Internship Board</span>
            <span className="block text-xs font-medium text-muted">PSU Phuket Campus</span>
          </span>
        </Link>

        <nav aria-label="Main" className="mx-auto hidden items-center gap-1 md:flex">
          {NAV.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3.5 py-2 text-[0.95rem] font-medium transition-colors ${
                  active ? "bg-navy-50 text-navy" : "text-ink hover:bg-navy-50 hover:text-navy"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <StudentAccount />
          <Link href="/admin" className="btn-primary h-10 px-4 text-sm">
            <Lock className="size-4" aria-hidden /> Staff
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="ml-auto grid size-10 place-items-center rounded-lg text-navy hover:bg-navy-50 md:hidden"
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-rule bg-white px-4 pt-2 pb-4 md:hidden">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`block rounded-lg px-3 py-3 font-medium ${isActive(href) ? "bg-navy-50 text-navy" : "text-ink"}`}
            >
              {label}
            </Link>
          ))}
          <MobileStudentLinks />
          <Link href="/admin" className="btn-primary mt-3 w-full">
            <Lock className="size-4" aria-hidden /> Staff
          </Link>
        </nav>
      )}
    </header>
  );
}

/** Student sign-in button, or the signed-in student's menu. */
function StudentAccount() {
  const session = useSession("student");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (session === undefined) return <span className="h-10 w-24" aria-hidden />;
  if (!session) {
    return (
      <Link href="/signin" className="btn-secondary h-10 px-4 text-sm">
        <LogIn className="size-4" aria-hidden /> Sign in
      </Link>
    );
  }
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-2 rounded-full border border-rule bg-white py-1 pr-3 pl-1 text-sm font-medium text-ink hover:border-navy-200"
      >
        <span className="grid size-8 place-items-center rounded-full bg-navy text-xs font-bold text-white uppercase">
          {session.name.slice(0, 1)}
        </span>
        <span className="max-w-[8rem] truncate">{session.name}</span>
      </button>
      {open && (
        <div role="menu" className="menu-pop absolute top-full right-0 z-50 mt-2 w-52 rounded-xl border border-rule bg-white p-1.5 shadow-[0_18px_40px_-16px_rgb(15_27_56/0.45)]">
          <Link
            href="/me"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-navy-50"
          >
            <Bookmark className="size-4 text-muted" aria-hidden /> My page
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut("student");
              router.push("/");
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-navy-50"
          >
            <LogOut className="size-4 text-muted" aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MobileStudentLinks() {
  const session = useSession("student");
  const router = useRouter();
  if (!session) {
    return (
      <Link href="/signin" className="btn-secondary mt-3 w-full">
        <LogIn className="size-4" aria-hidden /> Student sign-in
      </Link>
    );
  }
  return (
    <div className="mt-3 border-t border-rule pt-3">
      <p className="px-3 text-sm text-muted">Signed in as {session.name}</p>
      <Link href="/me" className="block rounded-lg px-3 py-3 font-medium text-ink">
        My page
      </Link>
      <button
        type="button"
        onClick={() => {
          signOut("student");
          router.push("/");
        }}
        className="block w-full rounded-lg px-3 py-3 text-left font-medium text-ink"
      >
        Sign out
      </button>
    </div>
  );
}
