"use client";

import { useEffect, useRef } from "react";

const chips = [
  ["Policy.md", "§3", "5%", "13%"],
  ["Contract.pdf", "p.14", "72%", "9%"],
  ["chunk", "1182", "46%", "6%"],
  ["rerank score", "0.92", "84%", "31%"],
  ["Source", "verified", "66%", "61%"],
  ["match", "0.94", "90%", "55%"],
  ["tenant", "acme", "14%", "78%"],
  ["DPA.pdf", "p.4", "78%", "83%"],
  ["retrieval", "scoped", "8%", "46%"],
  ["MSA.pdf", "p.15", "58%", "88%"],
  ["embedding", "ready", "30%", "39%"],
  ["Handbook.docx", "indexed", "39%", "92%"]
];

export function AnimatedBackground() {
  const fieldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const field = fieldRef.current;

    if (!field || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const onMove = (event: MouseEvent) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      field.style.transform = `translate(${(x * 18).toFixed(1)}px, ${(y * 18).toFixed(1)}px)`;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="animated-background" aria-hidden="true">
      <div className="background-field" ref={fieldRef}>
        <svg className="background-arcs" viewBox="0 0 1000 720" preserveAspectRatio="none">
          <g fill="none" stroke="#11B877" strokeDasharray="2 8" strokeLinecap="round" strokeWidth="1.4">
            <path d="M120 130 C 320 90, 520 220, 760 150" style={{ animation: "dash 9s linear infinite" }} />
            <path d="M180 560 C 380 520, 560 600, 840 520" style={{ animation: "dash 12s linear infinite" }} />
            <path d="M860 300 C 700 380, 520 360, 300 430" style={{ animation: "dash 11s linear infinite" }} />
          </g>
        </svg>
        {chips.map(([label, value, left, top], index) => (
          <div className="bg-chip" key={`${label}-${value}`} style={{ left, top, animationDelay: `${index * -1.7}s` }}>
            {label} <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
