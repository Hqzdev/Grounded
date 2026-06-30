import { LegalPage } from "@/components/LegalPage";

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Cookies"
      title="Cookie Policy"
      intro="Grounded uses cookies to keep sessions secure and to remember consent choices. Optional categories are disabled unless the user allows them."
      sections={[
        {
          title: "Necessary Cookies",
          body: "Necessary cookies support authentication, session security, CSRF-resistant same-site behavior, and cookie consent storage. These cookies are required for the application to work."
        },
        {
          title: "Analytics Cookies",
          body: "Analytics cookies may be used later to understand product usage, performance, and reliability. They are not required for authentication or workspace access."
        },
        {
          title: "Preference Cookies",
          body: "Preference cookies may remember interface choices such as consent settings, workspace display preferences, or non-sensitive UI configuration."
        },
        {
          title: "Marketing Cookies",
          body: "Marketing cookies may support campaign attribution or product communication measurement. They are optional and should not be enabled without consent."
        },
        {
          title: "Changing Choices",
          body: "Users can choose necessary-only cookies or allow all categories from the consent menu. Necessary cookies remain enabled because login and security depend on them."
        }
      ]}
    />
  );
}
