import { AnimatedNumber } from "@/components/AnimatedNumber";

export function ProductPreview() {
  return (
    <div className="product-window">
      <div className="window-bar">
        <span className="window-light" style={{ background: "#e2563b" }} />
        <span className="window-light" style={{ background: "#e8a33d" }} />
        <span className="window-light" style={{ background: "#11b877" }} />
        <span className="mono" style={{ color: "var(--muted)", fontSize: 12, marginLeft: 6 }}>
          grounded · Northwind Legal
        </span>
      </div>
      <div className="preview-body">
        <div className="chat-question">What are the termination clauses?</div>
        <div className="chat-answer">
          Either party may terminate for convenience with sixty days&apos; notice<sup style={{ color: "var(--accent)", fontWeight: 800 }}>[1]</sup>, or
          immediately for an uncured material breach<sup style={{ color: "var(--accent)", fontWeight: 800 }}>[2]</sup>.
        </div>
        <div className="citation-card" data-cursor="interactive">
          <div className="citation-head">
            <span>
              <span className="citation-index">1</span>
              MSA.pdf · p.14
            </span>
            <strong className="mono" style={{ color: "#0b7d52", fontSize: 11 }}>
              <AnimatedNumber value={0.94} decimals={2} />
            </strong>
          </div>
          <p>&quot;Either party may terminate this Agreement for convenience upon sixty days&apos; prior written notice...&quot;</p>
        </div>
        <div className="pill-row">
          <span className="pill">confidence 0.91</span>
          <span className="pill">1.24s</span>
          <span className="pill">tenant: scoped</span>
        </div>
        <div className="pill" style={{ alignSelf: "flex-start", background: "var(--ink)", color: "var(--accent-hot)" }}>
          Verified by sources
        </div>
      </div>
    </div>
  );
}
