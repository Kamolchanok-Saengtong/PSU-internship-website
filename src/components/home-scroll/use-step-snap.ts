"use client";

import { useLenis } from "lenis/react";
import { useEffect, useRef, type RefObject } from "react";

/**
 * One scroll gesture = one step forward, inside a pinned section. Scrolling back up is free.
 *
 * While the section is pinned, wheel and swipe input is taken over: each gesture
 * glides to the next (or previous) step, and further input is ignored until the
 * glide has finished and the gesture has gone quiet (so trackpad momentum or a
 * hard flick can't skip steps). Scrolling past the last step leaves the section
 * normally, and fast scrolls that would fly into the section stop at its first step.
 *
 * `stepY(i)` returns the page scroll position that shows step i.
 */
export function useStepSnap({
  sectionRef,
  steps,
  stepY,
  enabled,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  steps: number;
  stepY: (i: number) => number;
  enabled: boolean;
}) {
  const lenis = useLenis();
  const current = useRef(0);
  const locked = useRef(false);
  const lastInput = useRef(0);
  const glideEnd = useRef(0);
  const prevY = useRef(0);
  /** True once the user has landed on a step; false again after leaving the section. */
  const inside = useRef(false);
  const stepYRef = useRef(stepY);
  stepYRef.current = stepY;

  useEffect(() => {
    if (!enabled) return;
    const GLIDE = 0.7; // seconds per step
    const GAP = 140; // ms of no input that marks the start of a new gesture
    let lastAbs = 0;

    const nearestStep = (y: number) => {
      let best = 0;
      for (let i = 1; i < steps; i++) if (Math.abs(stepYRef.current(i) - y) < Math.abs(stepYRef.current(best) - y)) best = i;
      return best;
    };

    const inZone = () => {
      const y = window.scrollY;
      return y >= stepYRef.current(0) - 4 && y <= stepYRef.current(steps - 1) + 4;
    };

    const goTo = (i: number) => {
      current.current = i;
      inside.current = true;
      locked.current = true;
      glideEnd.current = performance.now() + GLIDE * 1000;
      const y = stepYRef.current(i);
      if (lenis) lenis.scrollTo(y, { duration: GLIDE, lock: true, force: true });
      else window.scrollTo({ top: y, behavior: "smooth" });
    };

    const gliding = () => locked.current && performance.now() < glideEnd.current;

    /**
     * Returns true when the input was taken over (caller should cancel it).
     * After a step, input is ignored until the glide ends. Then only *active*
     * scrolling moves again: a new gesture after a pause, or input that holds
     * steady or speeds up. Trackpad momentum always fades, so it is ignored
     * and can't skip steps; steady scrolling keeps advancing, so it never sticks.
     */
    const handle = (dir: number, abs: number) => {
      if (!inZone()) return false;
      // Scrolling back up is always free: only forward movement goes step by step.
      if (dir < 0) {
        locked.current = false;
        lastInput.current = 0;
        return false;
      }
      const now = performance.now();
      // Rising input, or steady mouse-wheel notches (about 100 each), is active scrolling.
      const fresh = now - lastInput.current > GAP || abs > lastAbs + 2 || (abs === lastAbs && abs >= 50);
      lastInput.current = now;
      lastAbs = abs;
      if (locked.current) {
        if (now < glideEnd.current || !fresh) return true;
        locked.current = false;
      }
      // Arriving from outside: land on the edge step first, never skip into the middle.
      if (!inside.current) {
        goTo(dir > 0 ? 0 : steps - 1);
        return true;
      }
      const from = nearestStep(window.scrollY);
      const to = from + dir;
      if (to < 0 || to >= steps) {
        inside.current = false; // leave the section normally
        return false;
      }
      goTo(to);
      return true;
    };

    const swallow = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation(); // keep Lenis from also scrolling
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 2 || e.ctrlKey) return;
      if (handle(Math.sign(e.deltaY), Math.abs(e.deltaY))) swallow(e);
    };

    let touchY: number | null = null;
    let touchUsed = false;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
      touchUsed = false;
      lastInput.current = 0; // every new touch is a new gesture
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY === null) return;
      const dy = touchY - (e.touches[0]?.clientY ?? touchY);
      if (!inZone()) return;
      if (dy < -8) return; // swiping back is free
      if (touchUsed) {
        swallow(e);
        return;
      }
      if (Math.abs(dy) < 24) {
        swallow(e);
        return;
      }
      if (handle(Math.sign(dy), 1e6)) {
        touchUsed = true;
        swallow(e);
      }
    };

    // Fast scrolls entering the section stop at its edge step.
    const onScroll = () => {
      const y = window.scrollY;
      const first = stepYRef.current(0);
      const last = stepYRef.current(steps - 1);
      if (!gliding()) {
        if (!inside.current && prevY.current < first - 4 && y > first + 4) goTo(0);
        else if (y < first - 40 || y > last + 40) inside.current = false;
      }
      prevY.current = y;
    };
    prevY.current = window.scrollY;

    const opts = { passive: false, capture: true } as const;
    window.addEventListener("wheel", onWheel, opts);
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, opts);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel, opts);
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, opts);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled, lenis, steps, sectionRef]);
}
