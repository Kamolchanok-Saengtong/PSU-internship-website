"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, Info, Loader2, Lock } from "lucide-react";
import { signIn, signInWithPassport, useSession, type Role } from "@/lib/auth";
import { usePlaces } from "@/lib/store";
import { HeroCopy, HeroLine, HeroScene } from "./hero-scene";

const COPY = {
  staff: {
    title: "Staff sign-in",
    intro: "Manage the internship, co-op and part-time places that PSU Phuket Campus students see on the board.",
    who: "For PSU Phuket Campus staff only.",
    idLabel: "Username",
    idHint: "e.g. somchai.s",
    or: "or use your username",
    home: "/admin",
    switchText: "Are you a student?",
    switchLink: { href: "/signin", label: "Student sign-in" },
  },
  student: {
    title: "Student sign-in",
    intro: "Sign in with your PSU account to keep track of the places you are interested in.",
    who: "For PSU Phuket Campus students.",
    idLabel: "Student ID",
    idHint: "e.g. 6510110123",
    or: "or use your student ID",
    home: "/me",
    switchText: "Are you staff?",
    switchLink: { href: "/login", label: "Staff sign-in" },
  },
} as const;

export function LoginForm({ role = "staff" }: { role?: Role }) {
  const c = COPY[role];
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : c.home;
  const session = useSession(role);
  const places = usePlaces();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"password" | "passport" | null>(null);

  // Already signed in: go straight on.
  useEffect(() => {
    if (session) router.replace(next);
  }, [session, next, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError(role === "student" ? "Enter your student ID and password." : "Enter your username and password.");
      return;
    }
    setBusy("password");
    try {
      await signIn(username, password, role);
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Try again.");
      setBusy(null);
    }
  }

  async function passport() {
    setError("");
    setBusy("passport");
    await signInWithPassport(role);
    router.replace(next);
  }

  return (
    <div className="hero-band min-h-[calc(100dvh-4.5rem)]">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_28rem] lg:gap-14 lg:py-14">
        <div className="hidden min-w-0 lg:block">
          <HeroCopy>
            <HeroLine>
              <h1 className="text-[clamp(2.2rem,4vw,3rem)] leading-tight font-bold tracking-[-0.02em] text-navy">{c.title}</h1>
            </HeroLine>
            <HeroLine>
              <p className="mt-3 max-w-md text-lg leading-relaxed text-body">{c.intro}</p>
            </HeroLine>
          </HeroCopy>
          <div className="mt-2 max-w-[30rem]">
            <HeroScene places={places} />
          </div>
        </div>

        <div className="panel-raised w-full p-6 sm:p-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Image src="/psu-emblem.svg" alt="" width={32} height={42} className="h-11 w-auto" />
            <h1 className="text-2xl font-bold text-navy">{c.title}</h1>
          </div>
          <h2 className="hidden text-xl font-bold text-navy lg:block">Sign in to continue</h2>
          <p className="mt-1 text-sm text-muted">{c.who}</p>

          <button
            type="button"
            onClick={passport}
            disabled={busy !== null}
            className="btn-primary mt-6 h-12 w-full text-[1rem]"
          >
            {busy === "passport" ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Lock className="size-5" aria-hidden />}
            {busy === "passport" ? "Signing in…" : "Sign in with PSU Passport"}
          </button>

          <div className="my-6 flex items-center gap-3 text-xs font-semibold tracking-wide text-muted uppercase">
            <span className="h-px flex-1 bg-rule" />
            {c.or}
            <span className="h-px flex-1 bg-rule" />
          </div>

          <form onSubmit={submit} noValidate className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-navy">{c.idLabel}</span>
              <input
                className="field"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={!!error && !username.trim()}
                placeholder={c.idHint}
                inputMode={role === "student" ? "numeric" : undefined}
              />
            </label>
            <div>
              <label htmlFor="staff-password" className="mb-1.5 block text-sm font-semibold text-navy">
                Password
              </label>
              <div className="relative">
                <input
                  id="staff-password"
                  className="field pr-11"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!error && !password}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-pressed={show}
                  className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-navy-50 hover:text-navy"
                >
                  {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  <span className="sr-only">{show ? "Hide password" : "Show password"}</span>
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-[#fdf1f0] px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy !== null} className="btn-secondary h-12 w-full">
              {busy === "password" && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {busy === "password" ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 flex items-start gap-2 rounded-lg border border-gold/60 bg-gold-soft/60 px-3 py-2.5 text-xs leading-relaxed text-gold-ink">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              <strong>Draft:</strong> sign-in is not connected yet, so any {role === "student" ? "student ID" : "username"} and password will
              work. Real authentication will be added later.
            </span>
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link href="/" className="inline-flex items-center gap-1.5 font-semibold text-navy-600 hover:underline">
              <ArrowLeft className="size-4" aria-hidden /> Back to the board
            </Link>
            <span className="text-muted">
              {c.switchText}{" "}
              <Link href={c.switchLink.href} className="font-semibold text-navy-600 hover:underline">
                {c.switchLink.label}
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
