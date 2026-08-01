"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

type Props = {
  /** True only while playing the unliked → liked burst. */
  active: boolean;
  className?: string;
};

/** Brand 4-point sparkle (inline SVG — no GIF/video). */
function SparkleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        d="M12 0.5L14.2 9.3L23.5 12L14.2 14.7L12 23.5L9.8 14.7L0.5 12L9.8 9.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

const PARTICLES = [
  { left: "38%", delay: "0ms", drift: "-22px", size: "0.7rem", color: "#B89DBB", duration: "900ms" },
  { left: "48%", delay: "50ms", drift: "-6px", size: "0.85rem", color: "#C9B4CC", duration: "1050ms" },
  { left: "56%", delay: "90ms", drift: "16px", size: "0.65rem", color: "#9A7BA0", duration: "950ms" },
  { left: "42%", delay: "140ms", drift: "-14px", size: "0.75rem", color: "#D4C0D7", duration: "1100ms" },
  { left: "52%", delay: "180ms", drift: "10px", size: "0.9rem", color: "#B89DBB", duration: "1000ms" },
  { left: "60%", delay: "220ms", drift: "24px", size: "0.6rem", color: "#8E6F94", duration: "1150ms" },
  { left: "45%", delay: "260ms", drift: "-4px", size: "0.7rem", color: "#C9B4CC", duration: "850ms" },
  { left: "54%", delay: "300ms", drift: "8px", size: "0.8rem", color: "#B89DBB", duration: "1200ms" },
] as const;

const BURST_MS = 1200;

/**
 * Lightweight brand sparkles near the Like control.
 * Pass `active={showAnimation}` only on unliked → liked (never on unlike).
 * Reduced-motion: no particles (parent should show a brief button glow/scale).
 */
export function BookmarkedLikeSparkles({ active, className }: Props) {
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!active || reducedMotion) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const handle = window.setTimeout(() => setVisible(false), BURST_MS);
    return () => window.clearTimeout(handle);
  }, [active, reducedMotion]);

  // Reduced-motion: no particles — Like button glow is handled by the parent.
  if (reducedMotion || !visible) return null;

  return (
    <span
      className={cn("pointer-events-none absolute inset-0 overflow-visible", className)}
      aria-hidden
    >
      {PARTICLES.map((particle, index) => (
        <span
          key={index}
          className="like-sparkle absolute bottom-1/2 text-primary"
          style={
            {
              left: particle.left,
              width: particle.size,
              height: particle.size,
              color: particle.color,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
              "--sparkle-drift": particle.drift,
            } as React.CSSProperties
          }
        >
          <SparkleGlyph className="h-full w-full" />
        </span>
      ))}
    </span>
  );
}

/** @deprecated Prefer BookmarkedLikeSparkles */
export const LikeSparkles = BookmarkedLikeSparkles;
