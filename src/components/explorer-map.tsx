"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, LayerGroup, LatLngBounds } from "leaflet";
import { CAMPUS } from "@/lib/geo";
import type { PlacementType } from "@/lib/types";

export type MapPoint = { id: string; coords: [number, number]; label: string; type: PlacementType; closed: boolean };
export type Bounds = { s: number; w: number; n: number; e: number };
export type ViewRequest = { center?: [number, number]; zoom?: number; fitAll?: boolean; nonce: number };

const TYPE_CLASS: Record<PlacementType, string> = {
  "Part-time": "pin-part",
  "Short-term internship": "pin-short",
  "Co-op": "pin-coop",
};

/**
 * Leaflet map with one pay pin per place. Pins that would overlap at the
 * current zoom merge into a count bubble; clicking it zooms in to split them.
 * Hover and selection are driven from outside so the list and map stay in sync.
 */
export function ExplorerMap({
  points,
  activeId,
  hoverId,
  focus,
  view,
  onSelect,
  onHover,
  onBounds,
}: {
  points: MapPoint[];
  activeId: string | null;
  hoverId: string | null;
  /** Bump the nonce to pan to a place picked from the list. */
  focus: { id: string; nonce: number } | null;
  view: ViewRequest | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onBounds: (b: Bounds) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const elsRef = useRef(new Map<string, HTMLElement>()); // place id -> pin or cluster element
  const pointsRef = useRef(points);
  pointsRef.current = points;
  const cb = useRef({ onSelect, onHover, onBounds });
  cb.current = { onSelect, onHover, onBounds };
  const stateRef = useRef({ activeId, hoverId });
  stateRef.current = { activeId, hoverId };
  const drawRef = useRef<() => void>(() => {});

  // Create the map once.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      LRef.current = L;
      const map = L.map(host, { zoomControl: false, scrollWheelZoom: true, minZoom: 5 }).setView([12.6, 100.6], 6);
      mapRef.current = map;
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);

      // Campus sits under the pins, and only appears once zoomed in near Phuket.
      const campus = L.marker(CAMPUS, {
        icon: L.divIcon({ className: "", html: `<span class="map-campus"><img src="/psu-emblem.svg" alt="" /></span>`, iconSize: [40, 40], iconAnchor: [20, 20] }),
        title: "PSU Phuket Campus",
        zIndexOffset: -1000,
      }).bindTooltip("PSU Phuket Campus", { direction: "top", offset: [0, -20] });
      const toggleCampus = () => (map.getZoom() >= 9 ? campus.addTo(map) : campus.remove());
      map.on("zoomend", toggleCampus);
      toggleCampus();

      const reportBounds = () => {
        const b: LatLngBounds = map.getBounds();
        cb.current.onBounds({ s: b.getSouth(), w: b.getWest(), n: b.getNorth(), e: b.getEast() });
      };
      map.on("zoomend", () => drawRef.current());
      map.on("moveend", reportBounds);
      map.on("click", () => cb.current.onSelect(null));

      const pts = pointsRef.current;
      if (pts.length) map.fitBounds(L.latLngBounds(pts.map((p) => p.coords)), { padding: [50, 50] });
      drawRef.current();
      reportBounds();
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw pins and clusters for the current zoom.
  drawRef.current = () => {
    const L = LRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();
    elsRef.current.clear();

    const zoom = map.getZoom();
    const CELL = 58; // px: pins closer than this merge
    const groups: MapPoint[][] = [];
    const placed: { x: number; y: number; g: MapPoint[] }[] = [];
    for (const p of pointsRef.current) {
      const pt = map.project(p.coords, zoom);
      const hit = placed.find((c) => Math.abs(c.x - pt.x) < CELL && Math.abs(c.y - pt.y) < CELL * 0.7);
      if (hit) hit.g.push(p);
      else {
        const g = [p];
        placed.push({ x: pt.x, y: pt.y, g });
        groups.push(g);
      }
    }

    for (const g of groups) {
      if (g.length === 1) {
        const p = g[0];
        const marker = L.marker(p.coords, {
          icon: L.divIcon({
            className: "",
            html: `<span class="pay-pin ${TYPE_CLASS[p.type]} ${p.closed ? "pin-closed" : ""}">${p.label}</span>`,
            iconSize: [0, 0],
          }),
          keyboard: true,
          title: p.label,
          riseOnHover: true,
        }).addTo(layer);
        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          cb.current.onSelect(p.id);
        });
        marker.on("mouseover", () => cb.current.onHover(p.id));
        marker.on("mouseout", () => cb.current.onHover(null));
        const el = marker.getElement()?.firstElementChild as HTMLElement | undefined;
        if (el) elsRef.current.set(p.id, el);
      } else {
        const lat = g.reduce((s, p) => s + p.coords[0], 0) / g.length;
        const lng = g.reduce((s, p) => s + p.coords[1], 0) / g.length;
        const size = 36 + Math.min(g.length, 10) * 2;
        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: "",
            html: `<span class="cluster-pin" style="width:${size}px;height:${size}px">${g.length}</span>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          }),
          title: `${g.length} places — zoom in`,
          keyboard: true,
        }).addTo(layer);
        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          const b = L.latLngBounds(g.map((p) => p.coords));
          if (map.getZoom() >= 15) map.setView([lat, lng], map.getZoom() + 2);
          else map.flyToBounds(b, { padding: [70, 70], maxZoom: 15, duration: 0.6 });
        });
        const el = marker.getElement()?.firstElementChild as HTMLElement | undefined;
        if (el) for (const p of g) elsRef.current.set(p.id, el);
      }
    }
    paintStates();
  };

  function paintStates() {
    const { activeId: a, hoverId: h } = stateRef.current;
    for (const el of elsRef.current.values()) el.classList.remove("is-active", "is-hover");
    if (h) elsRef.current.get(h)?.classList.add("is-hover");
    if (a) elsRef.current.get(a)?.classList.add("is-active");
    // Bring the highlighted pin above its neighbours.
    for (const [id, el] of elsRef.current) {
      const box = el.parentElement;
      if (box) box.style.zIndex = id === a ? "900" : id === h ? "800" : "";
    }
  }

  useEffect(() => {
    drawRef.current();
  }, [points]);

  useEffect(paintStates, [activeId, hoverId]);

  // Pan to a place chosen in the list.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    const p = pointsRef.current.find((x) => x.id === focus.id);
    if (!p) return;
    map.flyTo(p.coords, Math.max(map.getZoom(), 13), { duration: 0.7 });
  }, [focus]);

  // Jump to a preset view.
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !view) return;
    if (view.fitAll && pointsRef.current.length) {
      map.flyToBounds(L.latLngBounds(pointsRef.current.map((p) => p.coords)), { padding: [50, 50], duration: 0.8 });
    } else if (view.center) {
      map.flyTo(view.center, view.zoom ?? 11, { duration: 0.8 });
    }
  }, [view]);

  return <div ref={hostRef} className="size-full" role="region" aria-label="Map of places" />;
}
