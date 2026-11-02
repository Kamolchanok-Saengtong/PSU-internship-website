"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Columns3, Lock, MapPinned, Search } from "lucide-react";
import { FACULTY_INFO } from "@/lib/faculties";
import { usePlaces } from "@/lib/store";
import { shortDate, statusOf } from "@/lib/status";
import { FACULTIES, PLACEMENT_TYPES, PROVINCES } from "@/lib/types";
import { TYPE_INFO } from "@/lib/placement";
import { HeroCopy, HeroLine, HeroScene } from "./hero-scene";
import { ApplyStory } from "./home-scroll/apply-story";
import { MapFlight } from "./home-scroll/map-flight";
import { Reveal } from "./home-scroll/motion-bits";
import { StatsBand } from "./home-scroll/stats-band";
import { TypesRail } from "./home-scroll/types-rail";
import { PositionRow } from "./position-row";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as React.CSSProperties;

export function Home() {
  const places = usePlaces();
  const open = (places ?? [])
    .filter((p) => statusOf(p) !== "closed")
    .sort((a, b) => a.closes.localeCompare(b.closes));

  return (
    <>
      {/* ---------- Welcome ---------- */}
      <section className="hero-band">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pt-12 pb-28 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:pt-14 lg:pb-32">
          <HeroCopy>
            <HeroLine>
              <h1 className="text-[clamp(2.4rem,5.5vw,3.75rem)] leading-[1.1] font-bold tracking-[-0.02em] text-navy">
                Find your internship,
                <br />
                <span className="hero-underline">all in one place</span>
              </h1>
            </HeroLine>
            <HeroLine>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-body">
                Part-time jobs, short-term internships and co-op placements for PSU Phuket Campus students, in
                Phuket and across Thailand.
              </p>
            </HeroLine>
            <HeroLine className="mt-8 flex flex-wrap gap-3">
              <Link href="/positions" className="btn-primary h-12 px-6 text-[1.02rem]">
                Browse all positions <ArrowRight className="size-5" aria-hidden />
              </Link>
              <Link href="/map" className="btn-secondary h-12">
                <MapPinned className="size-5" aria-hidden /> Find on the map
              </Link>
            </HeroLine>
          </HeroCopy>

          <HeroScene places={places} />
        </div>
      </section>

      {/* ---------- Search, overlapping the welcome band ---------- */}
      <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-4 sm:px-6">
        <HomeSearch />
      </div>

      {places !== null && <StatsBand places={places} />}

      {/* ---------- Placement types: pinned horizontal rail ---------- */}
      {places !== null && <TypesRail places={places} />}

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ---------- Quick links ---------- */}
        <Reveal as="section" className="pt-20">
          <h2 id="quick-title" className="text-2xl font-bold text-navy sm:text-[1.75rem]">
            Available right now
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/positions", icon: Search, title: "All positions", text: "Search and filter every open place" },
              { href: "/map", icon: MapPinned, title: "Find by province", text: "Places on a map of Thailand" },
              { href: "/compare", icon: Columns3, title: "Compare places", text: "Up to 3 places side by side" },
              { href: "/admin", icon: Lock, title: "Staff", text: "Add or update internship places" },
            ].map(({ href, icon: Icon, title, text }, i) => (
              <li key={href} className="rise" style={delay(i * 60)}>
                <Link
                  href={href}
                  className="panel flex h-full items-center gap-4 p-4 transition-[border-color,box-shadow] hover:border-navy-200 hover:shadow-[0_10px_30px_-20px_rgb(15_27_56/0.45)]"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold text-navy">{title}</span>
                    <span className="block text-sm text-muted">{text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ---------- Closing soon ---------- */}
        <Reveal as="section" className="pt-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="closing-title" className="text-2xl font-bold text-navy sm:text-[1.75rem]">
                Closing soon
              </h2>
              <p className="mt-1 text-muted">Places with the earliest application deadlines.</p>
            </div>
            <Link href="/positions" className="inline-flex items-center gap-1.5 font-semibold text-navy hover:underline">
              See all positions <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          {places === null ? (
            <div className="mt-5 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />
              ))}
            </div>
          ) : open.length ? (
            <ul className="mt-5 space-y-3">
              {open.slice(0, 5).map((p) => (
                <PositionRow key={p.id} place={p} status={statusOf(p)} />
              ))}
            </ul>
          ) : (
            <p className="panel mt-5 p-8 text-muted">No places are open right now. Check back soon.</p>
          )}
        </Reveal>
      </div>

      {/* ---------- Pinned map: route from campus across Thailand ---------- */}
      {places !== null && <MapFlight places={places} />}

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ---------- By faculty ---------- */}
        <Reveal as="section" className="pt-20">
          <h2 id="faculty-title" className="text-2xl font-bold text-navy sm:text-[1.75rem]">
            Places by faculty
          </h2>
          <p className="mt-1 text-muted">Each place lists the faculties it accepts.</p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FACULTIES.map((f) => {
              const info = FACULTY_INFO[f];
              const list = open.filter((p) => p.faculties.includes(f));
              return (
                <li key={f}>
                  <Link
                    href={`/positions?faculty=${info.slug}`}
                    className="panel group flex h-full flex-col p-5 transition-[border-color,box-shadow] hover:border-navy-200 hover:shadow-[0_10px_30px_-20px_rgb(15_27_56/0.45)]"
                  >
                    <span className="flex h-11 items-center">
                      <Image
                        src={info.logo}
                        alt={`${f} logo`}
                        width={info.width}
                        height={info.height}
                        className="h-auto max-h-10 w-auto max-w-full object-contain object-left"
                      />
                    </span>
                    <span className="mt-4 font-semibold text-navy">{f}</span>
                    <span className="mt-1 text-sm text-muted">
                      {places === null ? "…" : `${list.length} open`}
                      {list[0] && ` · next ${shortDate(list[0].closes)}`}
                    </span>
                    <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-navy-600">
                      View {info.code} places
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>

      {/* ---------- How to apply: pinned step-by-step story ---------- */}
      {places !== null && <ApplyStory places={places} />}

      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        <p className="pt-10 text-sm text-muted">
          Sample listings for the draft. Companies and contacts are invented; staff replace them from the Staff page.
        </p>
      </div>
    </>
  );
}

function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [faculty, setFaculty] = useState("");
  const [type, setType] = useState("");
  const [province, setProvince] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (faculty) params.set("faculty", faculty);
    if (type) params.set("type", type);
    if (province) params.set("province", province);
    const qs = params.toString();
    router.push(qs ? `/positions?${qs}` : "/positions");
  }

  return (
    <form onSubmit={submit} role="search" className="panel-raised grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-[1fr_10rem_11.5rem_12rem_auto] lg:items-end">
      <label className="block sm:col-span-2 lg:col-span-1">
        <span className="mb-1.5 block text-sm font-semibold text-navy">Search places</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Role or company, e.g. front office"
          className="field"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-navy">Type</span>
        <select value={type} onChange={(e) => setType(e.target.value)} className="field">
          <option value="">All types</option>
          {PLACEMENT_TYPES.map((t) => (
            <option key={t} value={TYPE_INFO[t].slug}>
              {TYPE_INFO[t].short}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-navy">Faculty</span>
        <select value={faculty} onChange={(e) => setFaculty(e.target.value)} className="field">
          <option value="">All faculties</option>
          {FACULTIES.map((f) => (
            <option key={f} value={FACULTY_INFO[f].slug}>
              {FACULTY_INFO[f].code} · {FACULTY_INFO[f].short}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-navy">Province</span>
        <select value={province} onChange={(e) => setProvince(e.target.value)} className="field">
          <option value="">All of Thailand</option>
          {PROVINCES.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn-primary sm:col-span-2 lg:col-span-1">
        <Search className="size-5" aria-hidden /> Search
      </button>
    </form>
  );
}
