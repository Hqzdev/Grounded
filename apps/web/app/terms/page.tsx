import { LegalPage } from "@/components/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of Service"
      intro="These terms describe the expected use of Grounded during development, evaluation, and future hosted operation."
      sections={[
        {
          title: "Use Of The Service",
          body: "Grounded is intended for document-grounded retrieval, citation inspection, tenant-scoped knowledge work, and related operational workflows."
        },
        {
          title: "User Responsibilities",
          body: "Users are responsible for the documents they upload, the access they grant to team members, and the legal basis for processing information inside a workspace."
        },
        {
          title: "No Unverified Reliance",
          body: "Grounded provides source-backed answers, but users must review citations and source documents before making legal, financial, medical, or operational decisions."
        },
        {
          title: "Acceptable Use",
          body: "The service must not be used to bypass access controls, extract another tenant's information, upload unlawful content, or attempt to degrade platform security."
        },
        {
          title: "Changes",
          body: "Terms may change as Grounded moves from local development toward hosted and self-hosted release models."
        }
      ]}
    />
  );
}
