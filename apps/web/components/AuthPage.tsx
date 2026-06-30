import Link from "next/link";
import { Logo } from "@/components/Chrome";

type AuthPageProps = {
  mode: "login" | "register";
};

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === "register";

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
        <form className="auth-card">
          <p className="eyebrow">{isRegister ? "Create workspace" : "Welcome back"}</p>
          <h2 style={{ fontSize: 34, letterSpacing: "-0.03em", margin: "0 0 6px" }}>{isRegister ? "Start with your team." : "Log in to Grounded."}</h2>
          <p style={{ color: "var(--muted)", margin: "0 0 20px" }}>
            {isRegister ? "Set up a tenant-scoped workspace for documents, citations, and usage tracking." : "Continue to your RAG workspace and inspect source-backed answers."}
          </p>
          {isRegister ? (
            <>
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input id="name" name="name" placeholder="Ada Lovelace" />
              </div>
              <div className="field">
                <label htmlFor="organization">Organization</label>
                <input id="organization" name="organization" placeholder="Northwind Legal" />
              </div>
            </>
          ) : null}
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input id="email" name="email" placeholder="you@company.com" type="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" placeholder="••••••••••" type="password" />
          </div>
          <button className="btn btn-primary" style={{ marginTop: 20, width: "100%" }} type="button">
            {isRegister ? "Create workspace" : "Log in"}
          </button>
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            <button className="btn btn-ghost" type="button">Continue with Google</button>
            <button className="btn btn-ghost" type="button">Continue with GitHub</button>
          </div>
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
