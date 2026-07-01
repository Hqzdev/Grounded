"use client";

import { usePathname } from "next/navigation";
import { CustomCursor } from "@/components/CustomCursor";

const cursorPages = new Set(["/", "/privacy", "/terms", "/cookies", "/security"]);

export function ConditionalCustomCursor() {
  const pathname = usePathname();

  if (!cursorPages.has(pathname)) {
    return null;
  }

  return <CustomCursor />;
}
