import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ConditionalCustomCursor } from "@/components/ConditionalCustomCursor";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grounded",
  description: "Self-hostable RAG platform with cited sources"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConditionalCustomCursor />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
