"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock, Menu, X } from "lucide-react";

const NAV = [
  { href: "/positions", label: "Positions" },
  { href: "/map", label: "Map" },
  { href: "/compare", label: "Compare" },
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

        <Link href="/admin" className="btn-primary hidden h-10 px-4 text-sm md:inline-flex">
          <Lock className="size-4" aria-hidden /> Staff
        </Link>

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
          <Link href="/admin" className="btn-primary mt-3 w-full">
            <Lock className="size-4" aria-hidden /> Staff
          </Link>
        </nav>
      )}
    </header>
  );
}
