
import Link from "next/link";
import { ArrowLeft, BookOpen, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Dr. Publish",
  description: "Draft Privacy Policy for Dr. Publish.",
};

const sections = [
  {
    title: "1. Purpose of this policy",
    content:
      "This draft explains the categories of information a research-support application may process and the questions that must be resolved before launch. It is not a final statement of Dr. Publish's actual data practices.",
  },
  {
    title: "2. Information you provide",
    content:
      "Depending on the features you use, information may include your name, email address, professional role, profile details, research interests, manuscripts, citations, research notes, and content you submit for analysis. The operator must confirm which fields are collected and which are optional.",
  },
  {
    title: "3. Account and authentication data",
    content:
      "Dr. Publish uses Supabase authentication in the current application. Authentication may process account identifiers, email addresses, password credentials, verification information, and session data. Passwords should be handled by the authentication provider rather than stored as plaintext by the application.",
  },
  {
    title: "4. Research documents and AI processing",
    content:
      "Documents and research text submitted for analysis may contain personal, confidential, unpublished, or sensitive information. Before launch, the operator must identify every AI model and external service that receives this content, what is sent, where processing occurs, and the providers' applicable retention and training practices. Do not submit confidential material unless you have confirmed that the processing is appropriate and authorized.",
  },
  {
    title: "5. How information may be used",
    content:
      "Depending on implemented features, information may be used to create and secure accounts, save profile preferences, process manuscripts, generate requested analyses, display research workflows, provide support, maintain service security, and troubleshoot failures. Only uses that actually occur should be included in the final policy.",
  },
  {
    title: "6. Storage, access, and security",
    content:
      "The application uses Supabase infrastructure for authentication and database functionality. The final policy must identify the relevant storage locations, access controls, applicable service providers, and security practices. Reasonable safeguards should protect data, but no online system can guarantee absolute security.",
  },
  {
    title: "7. Sharing and service providers",
    content:
      "Information may be processed by infrastructure, authentication, AI, email, analytics, or other providers only where those services are actually integrated and the processing is appropriately authorized. The final policy must name relevant providers or categories, explain the purpose of sharing, and describe applicable safeguards. Information should not be described as shared with a provider until that integration has been verified.",
  },
  {
    title: "8. Retention and deletion",
    content:
      "The actual retention periods for account details, manuscripts, generated reports, logs, and backups must be documented before launch. The final policy should explain how users can request account deletion or data removal, what is deleted, what may remain temporarily in backups, and any lawful retention exceptions.",
  },
  {
    title: "9. Cookies and session data",
    content:
      "Authentication may use cookies or similar mechanisms to maintain sessions and protect access. The final policy should document the actual cookies, their purposes, and any analytics or tracking technologies used by the deployed application.",
  },
  {
    title: "10. Your choices and rights",
    content:
      "Depending on applicable law, users may have rights to access, correct, delete, or obtain a copy of their personal information, or to object to or restrict certain processing. The operator must establish a contact and process for handling requests and explain any applicable limitations.",
  },
  {
    title: "11. Children and eligibility",
    content:
      "The operator must determine the intended minimum age for the service and the rules that apply in the jurisdictions where it is offered. The final policy must accurately describe those requirements and how concerns about underage accounts are handled.",
  },
  {
    title: "12. International processing",
    content:
      "If information is processed or stored in other countries, the final policy must identify relevant locations or explain the applicable transfer arrangements as required by law. The operator must verify actual provider regions and processing locations before making such statements.",
  },
  {
    title: "13. Policy changes and contact",
    content:
      "The final policy should state how updates will be published, when they become effective, and how users can ask privacy questions or submit complaints. The operator's legal name, contact email, and any required grievance or privacy contact details must be added before launch.",
  },
];

export default function PrivacyPage() {
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
            DRAFT â€” VERIFY BEFORE PUBLIC LAUNCH
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            This preliminary policy includes items that must be verified
            against the deployed application, its actual data flows, and
            applicable law. It must not be treated as a final or complete
            privacy disclosure.
          </p>
        </header>

        <div className="mt-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <BookOpen size={21} />
          </span>
          <span className="text-lg font-semibold">Dr. Publish</span>
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          How information may be handled when using Dr. Publish.
        </p>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-blue-600" />
          <p className="text-sm leading-6 text-gray-600">
            Research documents can contain unpublished or confidential work.
            Review the service&apos;s verified data practices before submitting
            sensitive research material.
          </p>
        </div>

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
            href="/terms"
            className="text-blue-600 hover:underline"
          >
            Terms of Service
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
