import { LegalPage } from "@/components/LegalPage";

export default function SecurityPage() {
  return (
    <LegalPage
      eyebrow="Security"
      title="Security Overview"
      intro="Grounded treats authentication, tenant isolation, source integrity, and auditability as product requirements, not later decorations."
      sections={[
        {
          title: "Authentication",
          body: "Web authentication uses server-managed httpOnly cookies. Access and refresh tokens are not exposed to browser JavaScript in the web application flow."
        },
        {
          title: "Session Rotation",
          body: "The backend issues short-lived access tokens and rotating refresh tokens. Refresh token reuse is treated as a compromised session family."
        },
        {
          title: "Tenant Boundaries",
          body: "Document ingestion, listing, retrieval, and question answering are scoped to the tenant claim attached to the authenticated session."
        },
        {
          title: "Audit Events",
          body: "Security-sensitive operations such as login, refresh, logout, password change, and session revocation are designed to write audit events."
        },
        {
          title: "Responsible Disclosure",
          body: "Security issues should be reported privately with reproduction steps, affected routes, expected impact, and any relevant logs or screenshots."
        }
      ]}
    />
  );
}
