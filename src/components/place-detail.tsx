"use client";

import Image from "next/image";
import Link from "next/link";
import { FACULTY_INFO } from "@/lib/faculties";
import { CalendarPlus, ChevronRight, Download, Mail } from "lucide-react";
import { usePlaces } from "@/lib/store";
import { allowanceText, countdown, longDate, statusOf } from "@/lib/status";
import { googleCalendarUrl, icsContent } from "@/lib/calendar";
import { CompareToggle, DateBlock, TypeTag } from "./position-row";
import { TYPE_INFO, durationText, placeLocation } from "@/lib/placement";
import { StatusBadge } from "./status-badge";
import { BenefitsList, DocumentsChecklist } from "./place-extras";
import { SaveButton } from "./save-button";
import { ApplyButton } from "./apply-button";

export function PlaceDetail({ id }: { id: string }) {
  const places = usePlaces();

  if (places === null) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-muted sm:px-6">Loading place…</div>;
  }

  const place = places.find((p) => p.id === id);

  if (!place) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold text-navy">This place is no longer listed</h1>
        <p className="mt-2 text-muted">Staff may have removed it. See all positions for current places.</p>
        <Link href="/positions" className="btn-primary mt-6">
          See all positions
        </Link>
      </div>
    );
  }

  const status = statusOf(place);
  const closed = status === "closed";

  const facts = [
    { label: "Applications close", value: longDate(place.closes), note: countdown(place.closes) },
    {
      label: "Period",
      value: `${longDate(place.starts)} – ${longDate(place.ends)}`,
      note: durationText(place.starts, place.ends),
    },
    { label: "Location", value: placeLocation(place), note: place.workMode },
    {
      label: place.payPer === "hour" ? "Pay" : "Allowance",
      value: allowanceText(place.allowance, place.payPer),
      note: place.hoursPerWeek ? `About ${place.hoursPerWeek} hours a week` : undefined,
    },
    { label: "Seats", value: String(place.seats) },
  ];

  function handleDownloadIcs() {
    const content = icsContent(place!);
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${place!.company.replace(/\s+/g, "-").toLowerCase()}-deadline.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <article>
      <header className="hero-band">
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-10 sm:px-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted">
            <Link href="/positions" className="hover:text-navy hover:underline">
              Positions
            </Link>
            <ChevronRight className="size-4" aria-hidden />
            <span className="truncate text-ink">{place.role}</span>
          </nav>
          <div className="mt-6 flex items-start gap-5">
            <DateBlock iso={place.closes} status={status} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <TypeTag type={place.placementType} />
                <StatusBadge status={status} />
                <span className="text-sm text-muted">{place.faculties.map((f) => FACULTY_INFO[f].code).join(" · ")}</span>
              </div>
              <h1 className="mt-2 text-[clamp(1.9rem,4.5vw,2.75rem)] leading-tight font-bold tracking-[-0.02em] text-navy text-balance">
                {place.role}
              </h1>
              <p className="mt-1 text-lg text-body">{place.company}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <dl className="panel grid overflow-hidden sm:grid-cols-2 lg:grid-cols-5">
          {facts.map((f, i) => (
            <div
              key={f.label}
              className={`border-rule px-5 py-4 ${i > 0 ? "border-t sm:border-t-0" : ""} ${i % 2 === 1 ? "sm:border-l" : ""} ${
                i > 1 ? "sm:border-t lg:border-t-0" : ""
              } ${i > 0 ? "lg:border-l" : ""}`}
            >
              <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{f.label}</dt>
              <dd className="tabular mt-1 leading-snug font-semibold text-ink">
                {f.value}
                {f.note && (
                  <span
                    className={`block text-sm font-medium ${
                      i === 0 && status === "final-call" ? "text-gold-ink" : "text-muted"
                    }`}
                  >
                    {f.note}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div className="max-w-[68ch] space-y-9">
            <section>
              <h2 className="text-xl font-bold text-navy">About this place</h2>
              <p className="mt-2 text-lg leading-relaxed">{place.summary}</p>
              <p className="mt-4 rounded-xl border border-rule bg-white px-4 py-3 text-[0.95rem]">
                <span className="font-semibold text-navy">{TYPE_INFO[place.placementType].label}:</span>{" "}
                {TYPE_INFO[place.placementType].text}
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-navy">What you will do</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 marker:text-navy-200">
                {place.duties.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold text-navy">Who can apply</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 marker:text-navy-200">
                {place.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
            <BenefitsList benefits={place.benefits ?? []} />
            <DocumentsChecklist placeId={place.id} documents={place.documents ?? []} />
            <section>
              <h2 className="text-xl font-bold text-navy">Open to students from</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {place.faculties.map((f) => {
                  const info = FACULTY_INFO[f];
                  return (
                    <li key={f} className="panel flex flex-col gap-3 px-4 py-3">
                      <Image
                        src={info.logo}
                        alt={`${f} logo`}
                        width={info.width}
                        height={info.height}
                        className="h-auto max-h-10 w-auto max-w-full object-contain object-left"
                      />
                      <span className="font-medium text-navy">
                        {info.code} · {f}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <aside className="panel h-fit p-5 lg:sticky lg:top-24">
            <div className="mb-5">
              <SaveButton placeId={place.id} />
            </div>
            <h2 className="text-xl font-bold text-navy">How to apply</h2>
            {closed ? (
              <p className="mt-2 text-muted">
                Applications closed on {longDate(place.closes)}. Ask your faculty&apos;s internship office about the next
                round.
              </p>
            ) : (
              <>
                <p className="mt-2 leading-relaxed">{place.howToApply}</p>
                <p className="mt-3 font-semibold text-navy">Send before {longDate(place.closes)}.</p>
              </>
            )}
            <div className="mt-5 border-t border-rule pt-4">
              <p className="text-sm text-muted">Contact</p>
              <p className="font-semibold text-ink">{place.contactName}</p>
              <p className="break-all text-navy-600">{place.contactEmail}</p>
            </div>
            {place.placementType === "Co-op" && (
              <div className="mt-5">
                <ApplyButton placeId={place.id} closed={closed} />
                {!closed && (
                  <p className="mt-2 text-xs text-muted">Co-op requests go to your advisor first, then the co-op office.</p>
                )}
              </div>
            )}
            {!closed && (
              <>
                <a
                  href={`mailto:${place.contactEmail}?subject=${encodeURIComponent(
                    `${place.placementType === "Co-op" ? "Question" : "Application"}: ${place.role} (PSU Phuket)`,
                  )}`}
                  className={`mt-3 w-full ${place.placementType === "Co-op" ? "btn-secondary h-10 text-sm" : "btn-primary mt-5"}`}
                >
                  <Mail className="size-5" aria-hidden /> {place.placementType === "Co-op" ? "Email a question" : "Email to apply"}
                </a>

                <p className="mt-5 text-sm font-semibold text-navy">Set a reminder</p>
                <div className="mt-2 grid gap-2">
                  <a href={googleCalendarUrl(place)} target="_blank" rel="noopener noreferrer" className="btn-secondary h-10 text-sm">
                    <CalendarPlus className="size-4" aria-hidden /> Add to Google Calendar
                  </a>
                  <button type="button" onClick={handleDownloadIcs} className="btn-secondary h-10 text-sm">
                    <Download className="size-4" aria-hidden /> Download .ics
                  </button>
                </div>
                <div className="mt-4 border-t border-rule pt-3">
                  <CompareToggle id={place.id} />
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </article>
  );
}
