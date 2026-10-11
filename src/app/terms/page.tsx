
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Dr. Publish",
  description: "Draft Terms of Service for Dr. Publish.",
};

const sections = [
  {
    title: "1. Acceptance of these terms",
    content:
      "By accessing or using Dr. Publish, you agree to these Terms of Service. If you do not agree, do not use the service. These terms are a draft and must be reviewed and approved before public launch.",
  },
  {
    title: "2. About Dr. Publish",
    content:
      "Dr. Publish is designed to assist researchers with research organization, manuscript preparation, publication readiness, and related workflows. Available features depend on the actual capabilities and integrations provided by the application.",
  },
  {
    title: "3. Your account",
    content:
      "You are responsible for providing accurate account information, maintaining the security of your credentials, and activity performed through your account. Do not impersonate others, share credentials in an unsafe manner, or attempt to access another user's account.",
  },
  {
    title: "4. Research content and ownership",
    content:
      "You remain responsible for the research materials you submit and must have the necessary rights and permissions to use them. These draft terms do not claim ownership of your manuscripts or research. The final policy must specify how submitted content is processed, stored, retained, and deleted.",
  },
  {
    title: "5. AI-assisted outputs",
    content:
      "AI-generated suggestions, summaries, formatting recommendations, and analysis may be incomplete or inaccurate. You must review outputs before using them in research, submitting manuscripts, or making publication decisions. You remain responsible for authorship, citations, research integrity, and compliance with applicable publication rules.",
  },
  {
    title: "6. Publication and journal information",
    content:
      "Journal details, formatting requirements, policies, and other publication information must be independently verified with the relevant publisher or journal. Dr. Publish must not be treated as a guarantee of acceptance, publication, compliance, or research quality.",
  },
  {
    title: "7. Acceptable use",
    content:
      "You must not use the service for unlawful activity, unauthorized access, infringement of others' rights, malicious activity, or attempts to compromise the service or other users' information.",
  },
  {
    title: "8. Privacy and data",
    content:
      "The collection and processing of personal information should be described in the Privacy Policy. Before launch, the operator must document actual data practices, third-party processors, retention periods, security measures, and available account or data deletion options.",
  },
  {
    title: "9. Service availability",
    content:
      "Features may change, become unavailable, or require maintenance. Any final limitations, service commitments, paid features, refunds, and account termination rules must be documented before the service is offered publicly.",
  },
  {
    title: "10. Disclaimers and liability",
    content:
      "The final agreement must explain applicable warranties, limitations of liability, and remedies in language that complies with the laws applicable to the service and its users. This draft does not establish final legal limitations or waive any rights that cannot legally be waived.",
  },
  {
    title: "11. Changes and contact",
    content:
      "The final policy should identify how changes will be communicated, when they take effect, and how users can contact the service operator about questions or complaints. Contact details and the effective date must be added before launch.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FA] px-5 py-8 text-[#212529] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 text-sm text-gray-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to sign up
        </Link>

        <header className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">
            DRAFT — NOT FINAL LEGAL TERMS
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            This preliminary page is provided for product development. It
            requires legal review, verified operator details, and confirmation
            of actual data practices before public launch.
          </p>
        </header>

        <div className="mt-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <BookOpen size={21} />
          </span>
          <span className="text-lg font-semibold">Dr. Publish</span>
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          From Research Draft to Publication Ready.
        </p>

        <div className="mt-8 space-y-7 rounded-2xl border border-gray-200 bg-white p-6 sm:p-9">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-7 text-gray-600">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        <footer className="flex flex-wrap gap-x-6 gap-y-3 py-8 text-sm">
          <Link
            href="/privacy"
            className="text-blue-600 hover:underline"
          >
            Privacy Policy
          </Link>
          <Link
            href="/auth/signup"
            className="text-gray-600 hover:text-blue-600"
          >
            Create account
          </Link>
          <Link
            href="/auth/login"
            className="text-gray-600 hover:text-blue-600"
          >
            Sign in
          </Link>
        </footer>
      </div>
    </main>
  );
}
