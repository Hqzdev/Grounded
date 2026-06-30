import Link from "next/link";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Logo } from "@/components/Chrome";
import { documents, sourceCards, usageMetrics } from "@/lib/mock-data";

const navItems = ["Chat", "Documents", "Sources", "Usage", "Settings"];

export function Workspace() {
  return (
    <main className="workspace">
      <aside className="sidebar">
        <Logo />
        <div className="side-nav">
          {navItems.map((item, index) => (
            <Link className={index === 0 ? "active" : ""} href={`#${item.toLowerCase()}`} key={item}>
              {item}
            </Link>
          ))}
        </div>
        <div style={{ marginTop: "auto" }}>
          <div className="workspace-card" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)", color: "var(--paper)" }}>
            <strong>Team plan</strong>
            <p style={{ color: "var(--soft)", fontSize: 13, margin: "8px 0 12px" }}>68% of monthly usage</p>
            <div className="score-bar">
              <span style={{ width: "68%" }} />
            </div>
          </div>
        </div>
      </aside>
      <section className="workspace-main">
        <div className="topbar">
          <div className="search-box">Search documents, sources, questions...</div>
          <span className="pill">Demo workspace</span>
          <button className="btn btn-primary" type="button">Upload document</button>
        </div>
        <section className="workspace-grid" id="chat">
          <div className="chat-panel">
            <p className="eyebrow">Chat</p>
            <h1 style={{ fontSize: 36, letterSpacing: "-0.03em", margin: "0 0 10px" }}>
              Ask questions. Inspect the <span className="display" style={{ color: "#0b7d52" }}>source trail</span>.
            </h1>
            <div className="pill-row" style={{ margin: "18px 0" }}>
              <span className="pill">What are the termination clauses?</span>
              <span className="pill">Which docs mention data retention?</span>
              <span className="pill">Summarize onboarding steps</span>
            </div>
            <div className="message user">What are the termination clauses?</div>
            <div className="message ai">
              Either party may terminate for convenience with sixty days&apos; notice, or immediately for an uncured material breach.
              <div className="source-list">
                {sourceCards.slice(0, 2).map((source, index) => (
                  <div className="citation-card" data-cursor="interactive" key={source.title}>
                    <div className="citation-head">
                      <span>
                        <span className="citation-index">{index + 1}</span>
                        {source.title} · {source.page}
                      </span>
                      <strong className="mono" style={{ color: "#0b7d52", fontSize: 11 }}>{source.score}</strong>
                    </div>
                    <p>{source.snippet}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside className="inspector-panel">
            <p className="eyebrow">Inspector</p>
            <h2 style={{ margin: "0 0 18px" }}>Retrieval proof</h2>
            {[
              ["Retrieval confidence", "91%"],
              ["Reranker score", "0.94"],
              ["Tenant filter", "active"],
              ["Latency", "1.24s"],
              ["Token cost", "$0.042"]
            ].map(([label, value], index) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ color: "var(--muted)", fontSize: 13 }}>{label}</span>
                  <strong className="mono">{value}</strong>
                </div>
                <div className="score-bar">
                  <span style={{ width: index < 2 ? `${91 - index * 6}%` : "100%" }} />
                </div>
              </div>
            ))}
          </aside>
        </section>
        <section className="workspace-card" id="documents">
          <p className="eyebrow">Documents</p>
          <div className="doc-table">
            {documents.map((document) => (
              <div className="doc-row" key={document.name}>
                <strong>{document.name}</strong>
                <span>{document.type}</span>
                <span className={`status-badge ${document.status}`}>{document.status}</span>
                <span className="mono">{document.chunks} chunks</span>
              </div>
            ))}
          </div>
        </section>
        <section className="stats-grid" id="usage">
          {usageMetrics.map((metric) => (
            <div className="metric" key={metric.label}>
              <strong>
                <AnimatedNumber formatCompact={metric.formatCompact} prefix={metric.prefix} value={metric.value} />
              </strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}
