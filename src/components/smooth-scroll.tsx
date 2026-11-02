"use client";

import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { useEffect, useState } from "react";

/**
 * Smooth, slightly eased page scrolling (Lenis). Native scroll position is kept,
 * so sticky sections and Motion's useScroll keep working. Off for reduced motion.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!enabled) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.12, wheelMultiplier: 1.15, touchMultiplier: 1.2, anchors: { offset: -80 } }}>
      {children}
    </ReactLenis>
  );
}
