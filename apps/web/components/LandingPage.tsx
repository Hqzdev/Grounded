import Link from "next/link";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Footer, Header } from "@/components/Chrome";
import { ProductPreview } from "@/components/ProductPreview";
import { Reveal } from "@/components/Reveal";
import { features, heroMetrics, pricing, problemCards, productStats, useCases } from "@/lib/mock-data";

export function LandingPage() {
  return (
    <main className="page-shell">
      <AnimatedBackground />
      <Header />
      <section className="wrap hero">
        <div>
          <Reveal>
            <div className="hero-kicker">
              <span className="pulse-dot" />
              Self-hostable · Multi-tenant RAG
            </div>
          </Reveal>
          <Reveal>
            <h1>
              Answers your team can actually <span className="display" style={{ color: "#0b7d52" }}>verify</span>.
            </h1>
          </Reveal>
          <Reveal>
            <p>
              A self-hostable RAG platform for teams that need document answers with cited sources, tenant isolation, and retrieval you can inspect.
            </p>
          </Reveal>
          <Reveal>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/app">
                Start workspace
              </Link>
              <Link className="btn btn-ghost" href="#architecture">
                View architecture
              </Link>
            </div>
          </Reveal>
          <Reveal>
            <div className="mini-stats">
              {heroMetrics.map((metric) => (
                <span key={metric.label}>
                  <strong className="mono">
                    <AnimatedNumber decimals={metric.decimals} suffix={metric.suffix} value={metric.value} />
                  </strong>{" "}
                  {metric.label}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal>
          <ProductPreview />
        </Reveal>
      </section>
      <section className="wrap stats-band">
        <Reveal>
          <div className="stats-grid">
            {productStats.map((metric) => (
              <div className="metric" key={metric.label}>
                <strong>
                  <AnimatedNumber decimals={metric.decimals} formatCompact={metric.value > 9999} prefix={metric.prefix} suffix={metric.suffix} value={metric.value} />
                </strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
      <section className="wrap section">
        <p className="eyebrow">The problem</p>
        <h2 className="section-title" style={{ maxWidth: 760, marginBottom: 46 }}>
          Most chat with your docs tools ask you to <span className="display">trust</span> a confident answer you can&apos;t trace.
        </h2>
        <div className="problem-grid">
          {problemCards.map((card) => (
            <Reveal key={card.title}>
              <article className={`problem-card ${card.dark ? "dark" : ""}`}>
                <span className="number-mark">{card.index}</span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="feature-band" id="product">
        <div className="wrap section">
          <p className="eyebrow">The platform</p>
          <h2 className="section-title" style={{ maxWidth: 680, marginBottom: 42 }}>
            Built for teams that <span className="display">cannot afford</span> hallucinations.
          </h2>
          <div className="feature-grid">
            {features.map((feature) => (
              <Reveal key={feature.title}>
                <article className={`feature-card ${feature.dark ? "dark" : ""} ${feature.wide ? "wide" : ""}`}>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                  {feature.title === "Source-grounded answers" ? (
                    <div className="pill-row" style={{ marginTop: 16 }}>
                      <span className="pill">MSA.pdf · p.14</span>
                      <span className="pill">DPA.pdf · p.4</span>
                      <span className="pill">+ 3 more</span>
                    </div>
                  ) : null}
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="wrap section" id="architecture">
        <p className="eyebrow">Architecture</p>
        <h2 className="section-title" style={{ maxWidth: 680 }}>
          Backend services. <span className="display">One</span> verifiable pipeline.
        </h2>
        <p style={{ color: "var(--muted)", maxWidth: 560, margin: "12px 0 44px" }}>
          A Rust gateway fronts isolated Python services. Documents flow through ingestion to embeddings; questions flow through retrieval to grounded generation.
        </p>
        <Reveal>
          <div className="arch-panel">
            <div className="arch-stack">
              <div className="arch-node gateway">
                <span className="pulse-dot" />
                Rust API Gateway
                <span className="lang" style={{ background: "#ce7c3b" }}>Rust</span>
              </div>
              <span className="arch-line" />
              <div className="arch-grid">
                {["Auth / Tenant", "Ingestion", "Embedding Worker", "Retrieval"].map((item) => (
                  <div className="arch-node" key={item}>
                    {item}
                    <span className="lang" style={{ background: "#3b7dd8" }}>Python</span>
                  </div>
                ))}
              </div>
              <span className="arch-line" />
              <div className="data-grid">
                {["PostgreSQL", "Qdrant", "Redis", "RabbitMQ", "MinIO"].map((item) => (
                  <div className="arch-node dark" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>
      <section className="use-band" id="usecases">
        <div className="wrap section">
          <p className="eyebrow" style={{ color: "var(--accent-hot)" }}>Use cases</p>
          <h2 className="section-title" style={{ maxWidth: 640, marginBottom: 44 }}>
            Wherever a wrong answer <span className="display" style={{ color: "var(--accent)" }}>costs</span> something.
          </h2>
          <div className="use-grid">
            {useCases.map(([index, title, body]) => (
              <article className="use-card" key={title}>
                <span>{index}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="wrap section" id="pricing">
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <p className="eyebrow">Pricing</p>
          <h2 className="section-title">
            Start free. <span className="display">Own</span> it when you scale.
          </h2>
        </div>
        <div className="pricing-grid">
          {pricing.map((plan) => (
            <article className={`price-card ${plan.dark ? "dark" : ""}`} key={plan.name}>
              <div>
                <h3>{plan.name}</h3>
                <p>{plan.detail}</p>
              </div>
              <div className="price">
                {plan.price}
                <small> {plan.cadence}</small>
              </div>
              <Link className={`btn ${plan.dark ? "btn-primary" : "btn-ghost"}`} href={plan.href}>
                {plan.cta}
              </Link>
              <ul className="check-list">
                {plan.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="wrap final-cta">
        <div className="cta-panel">
          <h2 className="section-title" style={{ maxWidth: 760, margin: "0 auto 20px" }}>
            Build a knowledge assistant your team can actually <span className="display" style={{ color: "#0b7d52" }}>audit</span>.
          </h2>
          <p style={{ color: "#3a453e", fontSize: 16, marginBottom: 30 }}>No source, no answer. That&apos;s the whole idea.</p>
          <Link className="btn btn-dark" href="/app">
            Create workspace
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
