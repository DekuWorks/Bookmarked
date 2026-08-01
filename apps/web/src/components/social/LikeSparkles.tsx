"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

type Props = {
  active: boolean;
  className?: string;
};

const PARTICLES = [
  { left: "42%", delay: "0ms", drift: "-18px" },
  { left: "50%", delay: "40ms", drift: "0px" },
  { left: "58%", delay: "80ms", drift: "18px" },
  { left: "46%", delay: "120ms", drift: "-10px" },
  { left: "54%", delay: "160ms", drift: "12px" },
];

/** Lightweight upward-fading sparkles — play only when liking. */
export function LikeSparkles({ active, className }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    setVisible(true);
    const handle = window.setTimeout(() => setVisible(false), 700);
    return () => window.clearTimeout(handle);
  }, [active]);

  if (!visible) return null;

  return (
    <span
      className={cn("pointer-events-none absolute inset-0 overflow-visible", className)}
      aria-hidden
    >
      {PARTICLES.map((particle, index) => (
        <span
          key={index}
          className="like-sparkle absolute bottom-1/2 h-1.5 w-1.5 rounded-full bg-royal-orange"
          style={
            {
              left: particle.left,
              animationDelay: particle.delay,
              "--sparkle-drift": particle.drift,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}
