"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Logo } from "@/components/Chrome";
import { ApiError, login, register, verifyEmail } from "@/lib/api";

type AuthPageProps = {
  mode: "login" | "register";
};

type AuthStatus = {
  tone: "success" | "error";
  message: string;
};

export function AuthPage({ mode }: AuthPageProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const email = getFormValue(form, "email");
    const password = getFormValue(form, "password");

    try {
      if (isRegister) {
        const name = getFormValue(form, "name");
        const tenantName = getFormValue(form, "organization");
        const registration = await register({
          email,
          password,
          name,
          tenant_name: tenantName
        });

        if (!registration.dev_verification_token) {
          setStatus({
            tone: "success",
            message: "Workspace created. Check your email to verify the account before logging in."
          });
          return;
        }

        await verifyEmail(registration.dev_verification_token);
      }

      await login({
        email,
        password,
        device_label: navigator.userAgent
      });

      router.push("/app");
    } catch (error) {
      setStatus({
        tone: "error",
        message: resolveAuthError(error)
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <Logo />
        <div>
          <p className="eyebrow" style={{ color: "var(--accent-hot)" }}>Verifiable RAG</p>
          <h1 style={{ fontSize: "clamp(42px, 6vw, 76px)", letterSpacing: "-0.04em", lineHeight: 0.96, margin: 0 }}>
            No source, <span className="display" style={{ color: "var(--accent)" }}>no answer</span>.
          </h1>
          <p style={{ color: "var(--soft)", fontSize: 18, lineHeight: 1.55, maxWidth: 520 }}>
            Sign in to inspect citations, upload documents, and keep retrieval tenant-scoped by default.
          </p>
        </div>
        <div className="citation-card" style={{ background: "#1b2620", borderColor: "#2a352e", maxWidth: 520 }}>
          <div className="citation-head">
            <span style={{ color: "var(--paper)" }}>
              <span className="citation-index">1</span>
              Security Policy.md · section 3
            </span>
            <strong className="mono" style={{ color: "var(--accent-hot)", fontSize: 11 }}>0.97</strong>
          </div>
          <p style={{ color: "var(--soft)" }}>&quot;Every retrieval request must include tenant scope before search and reranking.&quot;</p>
        </div>
      </section>
      <section className="auth-form-wrap">
        <form className="auth-card" onSubmit={handleSubmit}>
          <p className="eyebrow">{isRegister ? "Create workspace" : "Welcome back"}</p>
          <h2 style={{ fontSize: 34, letterSpacing: "-0.03em", margin: "0 0 6px" }}>{isRegister ? "Start with your team." : "Log in to Grounded."}</h2>
          <p style={{ color: "var(--muted)", margin: "0 0 20px" }}>
            {isRegister ? "Set up a tenant-scoped workspace for documents, citations, and usage tracking." : "Continue to your RAG workspace and inspect source-backed answers."}
          </p>
          {isRegister ? (
            <>
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input autoComplete="name" id="name" name="name" placeholder="Ada Lovelace" required />
              </div>
              <div className="field">
                <label htmlFor="organization">Organization</label>
                <input autoComplete="organization" id="organization" name="organization" placeholder="Northwind Legal" required />
              </div>
            </>
          ) : null}
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input autoComplete="email" id="email" name="email" placeholder="you@company.com" required type="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input autoComplete={isRegister ? "new-password" : "current-password"} id="password" minLength={12} name="password" placeholder="At least 12 characters" required type="password" />
          </div>
          {status ? (
            <div className={`auth-message ${status.tone}`} role={status.tone === "error" ? "alert" : "status"}>
              {status.message}
            </div>
          ) : null}
          <button className="btn btn-primary" disabled={isSubmitting} style={{ marginTop: 20, width: "100%" }} type="submit">
            {isSubmitting ? "Working..." : isRegister ? "Create workspace" : "Log in"}
          </button>
          <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 18, textAlign: "center" }}>
            {isRegister ? "Already have an account?" : "No workspace yet?"}{" "}
            <Link href={isRegister ? "/login" : "/register"} style={{ color: "#0b7d52", fontWeight: 700 }}>
              {isRegister ? "Log in" : "Create account"}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

function getFormValue(form: FormData, key: string) {
  const value = form.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Fill in all required fields.");
  }

  return value.trim();
}

function resolveAuthError(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Authentication failed.";
}
