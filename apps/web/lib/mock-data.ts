export const heroMetrics = [
  { value: 99.2, suffix: "%", decimals: 1, label: "grounded responses" },
  { value: 9, label: "isolated services" },
  { value: 0, label: "shared tenant data" }
];

export const productStats = [
  { value: 97, suffix: "%", label: "retrieval confidence" },
  { value: 143, label: "indexed sources" },
  { value: 0.042, prefix: "$", decimals: 3, label: "est. answer cost" },
  { value: 1.2, suffix: "s", decimals: 1, label: "average latency" },
  { value: 24, label: "tenant workspaces" },
  { value: 8431, label: "chunks indexed" }
];

export const problemCards = [
  {
    index: "01",
    title: "No source, no trust",
    body: "An answer without a citation is just a fluent guess. Grounded refuses to answer beyond what the documents support.",
    dark: true
  },
  {
    index: "02",
    title: "Vector search is not enough",
    body: "Pure embeddings miss exact terms and clause numbers. Hybrid retrieval plus reranking surfaces what actually matters."
  },
  {
    index: "03",
    title: "Tenant isolation matters",
    body: "One client's contract must never leak into another's retrieval. Isolation is scoped at the query, not bolted on after."
  }
];

export const features = [
  {
    title: "Source-grounded answers",
    body: "Every claim links to the exact passage it came from: document, page, and snippet.",
    wide: true
  },
  {
    title: "Hybrid retrieval + reranking",
    body: "Dense vectors and keyword search, fused and reranked so the right chunk wins."
  },
  {
    title: "Multi-tenant isolation",
    body: "Tenant-scoped retrieval by default. No cross-tenant leakage, ever."
  },
  {
    title: "Usage and cost ledger",
    body: "Tokens, questions, and provider spend tracked per workspace. No surprise invoices.",
    dark: true,
    wide: true
  }
];

export const useCases = [
  ["01", "Customer support KB", "Agents get cited answers from product docs and macros without improvising."],
  ["02", "Legal contract review", "Surface clauses and obligations with the exact page they live on."],
  ["03", "Internal wiki and onboarding", "New hires ask questions and get answers grounded in your handbook."],
  ["04", "Research over large sets", "Query thousands of documents and trace every conclusion back to its origin."]
];

export const pricing = [
  {
    name: "Starter",
    detail: "For solo evaluation",
    price: "$0",
    cadence: "/ mo",
    cta: "Get started",
    href: "/register",
    items: ["1 workspace and 1 seat", "50 documents", "Cited answers", "Community support"]
  },
  {
    name: "Team",
    detail: "For teams that audit answers",
    price: "$49",
    cadence: "/ seat / mo",
    cta: "Start workspace",
    href: "/register",
    dark: true,
    items: ["Unlimited documents", "Hybrid retrieval and reranking", "Multi-tenant isolation", "Usage and cost ledger", "Priority support"]
  },
  {
    name: "Self-hosted",
    detail: "Run it in your own VPC",
    price: "Custom",
    cadence: "",
    cta: "Talk to us",
    href: "/register",
    items: ["Everything in Team", "Air-gapped deployment", "Local embedding models", "SSO and audit logs", "Dedicated SLA"]
  }
];

export const documents = [
  { name: "Master Services Agreement.pdf", type: "PDF", status: "indexed", chunks: "418", owner: "Legal" },
  { name: "Security Policy.md", type: "Markdown", status: "indexed", chunks: "86", owner: "Security" },
  { name: "Customer Handbook.docx", type: "DOCX", status: "processing", chunks: "214", owner: "Ops" },
  { name: "Legacy DPA.pdf", type: "PDF", status: "failed", chunks: "0", owner: "Legal" }
];

export const sourceCards = [
  {
    title: "MSA.pdf",
    page: "p.14",
    score: "0.94",
    snippet: "Either party may terminate this Agreement for convenience upon sixty days' prior written notice."
  },
  {
    title: "DPA.pdf",
    page: "p.4",
    score: "0.91",
    snippet: "A material breach may be terminated immediately if not cured within the agreed remedy window."
  },
  {
    title: "Security Policy.md",
    page: "section 3",
    score: "0.87",
    snippet: "Tenant-scoped retrieval must filter every query before vector search and reranking."
  }
];

export const usageMetrics = [
  { label: "Questions asked", value: 1268 },
  { label: "Tokens used", value: 4100000, formatCompact: true },
  { label: "Estimated cost", value: 58, prefix: "$" },
  { label: "Indexed docs", value: 143 }
];
