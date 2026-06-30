"use client";

import { useEffect, useRef, useState } from "react";

type AnimatedNumberProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  formatCompact?: boolean;
};

function formatValue(value: number, decimals: number, formatCompact: boolean) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
    notation: formatCompact ? "compact" : "standard"
  }).format(value);
}

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 900,
  formatCompact = false
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);
  const [display, setDisplay] = useState(`${prefix}${formatValue(0, decimals, formatCompact)}${suffix}`);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => setDisplay(`${prefix}${formatValue(value, decimals, formatCompact)}${suffix}`);

    if (media.matches) {
      finish();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) {
          return;
        }

        started.current = true;
        const start = performance.now();

        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          const next = value * eased;
          setDisplay(`${prefix}${formatValue(next, decimals, formatCompact)}${suffix}`);

          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            finish();
          }
        };

        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.2 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [decimals, duration, formatCompact, prefix, suffix, value]);

  return <span ref={ref}>{display}</span>;
}
