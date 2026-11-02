"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { allowanceText, countdown, statusOf } from "@/lib/status";
import { placeLocation } from "@/lib/placement";
import { CAMPUS, PROVINCE_COORDS } from "@/lib/geo";
import { PROVINCES, type Place } from "@/lib/types";



const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** A real map of Thailand (OpenStreetMap tiles) with a pin per province. */
export function ThailandMap({ places }: { places: Place[] }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let map: import("leaflet").Map | undefined;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;

      map = L.map(host, { scrollWheelZoom: false, zoomControl: true }).setView([12.6, 100.6], 6);
      // Frame every province with listings, from Chiang Mai down to Hat Yai.
      map.fitBounds(L.latLngBounds(Object.values(PROVINCE_COORDS)), { padding: [40, 40] });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Campus (only once zoomed in, so it doesn't sit on top of the Phuket pin)
      const campus = L.marker(CAMPUS, {
        icon: L.divIcon({
          className: "",
          html: `<span class="map-campus"><img src="/psu-emblem.svg" alt="" /></span>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
        title: "PSU Phuket Campus",
        zIndexOffset: 500,
      })
        .bindPopup(`<p class="map-pop-title">PSU Phuket Campus</p><p class="map-pop-sub">Kathu, Phuket</p>`);
      const showCampus = () => {
        if (!map) return;
        if (map.getZoom() >= 9) campus.addTo(map);
        else campus.remove();
      };
      map.on("zoomend", showCampus);
      showCampus();

      // One pin per province, sized by how many places are open there.
      for (const area of PROVINCES) {
        const open = places
          .filter((p) => p.province === area && statusOf(p) !== "closed")
          .sort((a, b) => a.closes.localeCompare(b.closes));
        const n = open.length;
        const size = n ? 38 + Math.min(n, 5) * 4 : 30;

        const list = open.length
          ? `<ul class="map-pop-list">${open
              .map(
                (p) =>
                  `<li><a href="/places/${encodeURIComponent(p.id)}">${escape(p.role)}</a><span>${escape(p.placementType)} · ${escape(
                    placeLocation(p),
                  )} · ${escape(allowanceText(p.allowance, p.payPer))} · ${escape(countdown(p.closes))}</span></li>`,
              )
              .join("")}</ul>`
          : `<p class="map-pop-sub">No open places right now.</p>`;

        L.marker(PROVINCE_COORDS[area], {
          icon: L.divIcon({
            className: "",
            html: `<span class="map-pin ${n ? "" : "map-pin-empty"}" style="width:${size}px;height:${size}px">${n}</span>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          }),
          title: `${area}: ${n} open`,
          keyboard: true,
        })
          .addTo(map)
          .bindTooltip(area, { direction: "top", offset: [0, -size / 2], className: "map-label", permanent: n > 0 })
          .bindPopup(
            `<p class="map-pop-title">${escape(area)}</p>${list}<a class="map-pop-all" href="/positions?province=${encodeURIComponent(
              area,
            )}">See all in ${escape(area)} →</a>`,
            { maxWidth: 280 },
          );
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [places]);

  return (
    <div
      ref={hostRef}
      role="region"
      aria-label="Map of Thailand with open places by province"
      className="panel h-[620px] w-full overflow-hidden"
    />
  );
}
