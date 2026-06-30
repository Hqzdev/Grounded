import { LegalPage } from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="Grounded is designed for source-grounded work with tenant-scoped documents. This policy explains what the product needs to process and what should never be treated casually."
      sections={[
        {
          title: "Data We Process",
          body: "Grounded processes account details, tenant information, uploaded document content, questions, generated answers, citations, security events, and operational logs needed to run the service."
        },
        {
          title: "How Data Is Used",
          body: "Data is used to authenticate users, isolate tenant workspaces, index documents, answer questions with citations, operate the platform, investigate abuse, and improve reliability."
        },
        {
          title: "Tenant Isolation",
          body: "Documents and retrieval requests are scoped to the active tenant. Cross-tenant access is not an accepted product behavior and must be treated as a security defect."
        },
        {
          title: "Security",
          body: "Authentication cookies are httpOnly and required for product access. Sensitive tokens are not exposed to browser JavaScript in the production-oriented web flow."
        },
        {
          title: "Retention",
          body: "Retention periods depend on deployment policy. Self-hosted operators are responsible for configuring backups, logs, object storage, and database retention."
        }
      ]}
    />
  );
}
