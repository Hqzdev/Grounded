"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ConsentPreferences = {
  necessary: true;
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
};

const cookieName = "grounded_cookie_consent";
const defaultPreferences: ConsentPreferences = {
  necessary: true,
  analytics: false,
  preferences: false,
  marketing: false
};

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(defaultPreferences);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(!readConsentCookie());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  function save(nextPreferences: ConsentPreferences) {
    const value = encodeURIComponent(JSON.stringify(nextPreferences));
    document.cookie = `${cookieName}=${value}; Max-Age=${180 * 24 * 60 * 60}; Path=/; SameSite=Lax`;
    setIsVisible(false);
  }

  function updatePreference(key: keyof Omit<ConsentPreferences, "necessary">) {
    setPreferences((current) => ({
      ...current,
      [key]: !current[key]
    }));
  }

  return (
    <section className="cookie-consent" aria-label="Cookie preferences">
      <div>
        <p className="eyebrow">Cookie Preferences</p>
        <h2>Choose how Grounded uses cookies.</h2>
        <p>
          Necessary cookies keep authentication, session security, and consent choices working. Optional cookies help with analytics,
          interface preferences, and future marketing measurement.
        </p>
        <div className="cookie-links">
          <Link href="/cookies">Cookie Policy</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
      {isCustomizing ? (
        <div className="cookie-options">
          <label>
            <input checked disabled type="checkbox" />
            <span>Necessary</span>
          </label>
          <label>
            <input checked={preferences.analytics} onChange={() => updatePreference("analytics")} type="checkbox" />
            <span>Analytics</span>
          </label>
          <label>
            <input checked={preferences.preferences} onChange={() => updatePreference("preferences")} type="checkbox" />
            <span>Preferences</span>
          </label>
          <label>
            <input checked={preferences.marketing} onChange={() => updatePreference("marketing")} type="checkbox" />
            <span>Marketing</span>
          </label>
        </div>
      ) : null}
      <div className="cookie-actions">
        <button className="btn btn-ghost" onClick={() => save(defaultPreferences)} type="button">
          Use necessary only
        </button>
        <button className="btn btn-ghost" onClick={() => setIsCustomizing((value) => !value)} type="button">
          Customize
        </button>
        <button className="btn btn-primary" onClick={() => save({ necessary: true, analytics: true, preferences: true, marketing: true })} type="button">
          Allow all
        </button>
        {isCustomizing ? (
          <button className="btn btn-dark" onClick={() => save(preferences)} type="button">
            Save choices
          </button>
        ) : null}
      </div>
    </section>
  );
}

function readConsentCookie() {
  return document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith(`${cookieName}=`));
}
