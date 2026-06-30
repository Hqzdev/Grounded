"use client";

import { useEffect, useRef } from "react";

type Point = {
  x: number;
  y: number;
  time: number;
};

const trailDuration = 320;
const trailLength = 20;

function buildSmoothPath(points: Point[]) {
  if (points.length < 2) {
    return "";
  }

  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  const [first, second, ...rest] = points;
  let path = `M ${first.x.toFixed(1)} ${first.y.toFixed(1)} Q ${second.x.toFixed(1)} ${second.y.toFixed(1)}`;
  let previous = second;

  for (const point of rest) {
    const midX = (previous.x + point.x) / 2;
    const midY = (previous.y + point.y) / 2;
    path += ` ${midX.toFixed(1)} ${midY.toFixed(1)} Q ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    previous = point;
  }

  const last = points[points.length - 1];
  path += ` ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;

  return path;
}

function isInteractive(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest("a, button, [role='button'], input, textarea, select, [data-cursor='interactive']"));
}

function isTextInput(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const glowRef = useRef<SVGPathElement | null>(null);
  const gradientRef = useRef<SVGLinearGradientElement | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const dot = dotRef.current;
    const path = pathRef.current;
    const glow = glowRef.current;
    const gradient = gradientRef.current;

    if (!dot || !path || !glow || !gradient) {
      return;
    }

    const render = () => {
      const now = performance.now();
      const points = pointsRef.current.filter((point) => now - point.time < trailDuration);
      pointsRef.current = points;

      if (points.length > 1) {
        const newest = points[points.length - 1];
        const oldest = points[0];
        const fade = Math.min(1, points.length / 8);
        const pathValue = buildSmoothPath(points);

        path.setAttribute("d", pathValue);
        glow.setAttribute("d", pathValue);
        path.style.opacity = `${fade}`;
        glow.style.opacity = `${fade * 0.34}`;
        path.style.strokeDasharray = String(Math.max(1, path.getTotalLength()));
        path.style.strokeDashoffset = "0";
        path.setAttribute("stroke", "url(#cursorTrailGradient)");
        glow.setAttribute("stroke", "url(#cursorTrailGradient)");
        gradient.setAttribute("x1", oldest.x.toFixed(1));
        gradient.setAttribute("y1", oldest.y.toFixed(1));
        gradient.setAttribute("x2", newest.x.toFixed(1));
        gradient.setAttribute("y2", newest.y.toFixed(1));
      } else {
        path.style.opacity = "0";
        glow.style.opacity = "0";
      }

      frameRef.current = requestAnimationFrame(render);
    };

    const onMove = (event: MouseEvent) => {
      if (isTextInput(event.target)) {
        dot.style.opacity = "0";
        path.style.opacity = "0";
        glow.style.opacity = "0";
        document.body.style.cursor = "auto";
        return;
      }

      document.body.style.cursor = "none";
      dot.style.opacity = "1";
      dot.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
      dot.classList.toggle("active", isInteractive(event.target));
      pointsRef.current = [...pointsRef.current, { x: event.clientX, y: event.clientY, time: performance.now() }].slice(-trailLength);
    };

    const onLeave = () => {
      dot.style.opacity = "0";
      path.style.opacity = "0";
      glow.style.opacity = "0";
      pointsRef.current = [];
      document.body.style.cursor = "auto";
    };

    const onDown = () => dot.classList.add("active");
    const onUp = () => dot.classList.remove("active");

    frameRef.current = requestAnimationFrame(render);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      document.body.style.cursor = "auto";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <>
      <svg className="cursor-layer cursor-trail" aria-hidden="true">
        <defs>
          <linearGradient ref={gradientRef} id="cursorTrailGradient" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(17,184,119,0)" />
            <stop offset="42%" stopColor="rgba(17,184,119,0.34)" />
            <stop offset="100%" stopColor="rgba(17,184,119,0.9)" />
          </linearGradient>
        </defs>
        <path ref={glowRef} className="cursor-trail-glow" fill="none" opacity="0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10" />
        <path ref={pathRef} className="cursor-trail-line" fill="none" opacity="0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
      </svg>
      <div className="cursor-dot" ref={dotRef} aria-hidden="true" />
    </>
  );
}
