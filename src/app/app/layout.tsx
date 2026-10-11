
"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus2,
  FileSearch,
  PenTool,
  CheckCircle2,
  Award,
  ShieldAlert,
  Search,
  BookMarked,
  Share2,
  Users2,
  History,
  Settings,
  HelpCircle,
  FileText,
  Sliders,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  Dna,
  PackageCheck,
  BookOpen,
  LogOut,
} from "lucide-react";
import { useProject } from "@/context/projectcontext";
import { createClient } from "@/lib/supabase/client";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const { projects, currentProject, setCurrentProject } = useProject();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Researcher");
  const [professionalRole, setProfessionalRole] = useState("Researcher");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAuthenticatedUser() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) return;

        const metadata = data.user.user_metadata ?? {};

        const fullName =
          typeof metadata.full_name === "string"
            ? metadata.full_name.trim()
            : typeof metadata.name === "string"
              ? metadata.name.trim()
              : "";

        const emailName = data.user.email?.split("@")[0] ?? "";

        const role =
          typeof metadata.professional_role === "string"
            ? metadata.professional_role.trim()
            : "";

        if (active) {
          setDisplayName(fullName || emailName || "Researcher");
          setProfessionalRole(role || "Researcher");
        }
      } catch {
        // Keep the safe fallback if the profile cannot be loaded.
      }
    }

    void loadAuthenticatedUser();

    return () => {
      active = false;
    };
  }, []);

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "R";

  const navSections = [
    {
      label: "Core Workspace",
      items: [
        { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/app/new-analysis", label: "New Analysis", icon: FilePlus2 },
        {
          href: "/app/document-analysis",
          label: "Document Analysis",
          icon: FileSearch,
        },
        {
          href: "/app/document-studio",
          label: "Document Studio",
          icon: PenTool,
        },
      ],
    },
    {
      label: "Evaluation & Pre-Review",
      items: [
        {
          href: "/app/quality-analyzer",
          label: "Quality Analyzer",
          icon: CheckCircle2,
        },
        {
          href: "/app/readiness-report",
          label: "Readiness Report",
          icon: Award,
        },
        {
          href: "/app/pre-review",
          label: "Pre-Review Engine",
          icon: ShieldAlert,
        },
        {
          href: "/app/research-gap",
          label: "Research Gap Explorer",
          icon: Sparkles,
        },
        {
          href: "/app/research-dna",
          label: "Research DNA",
          icon: Dna,
        },
        {
          href: "/app/evidence-citations",
          label: "Evidence & Citations",
          icon: BookMarked,
        },
      ],
    },
    {
      label: "Journal & Submission",
      items: [
        {
          href: "/app/journal-finder",
          label: "Journal Finder",
          icon: Search,
        },
        {
          href: "/app/journal-compliance",
          label: "Compliance Rules",
          icon: CheckCircle2,
        },
        {
          href: "/app/journal-formatting",
          label: "Journal Formatting",
          icon: Sliders,
        },
        {
          href: "/app/submission-package",
          label: "Submission Package",
          icon: PackageCheck,
        },
      ],
    },
    {
      label: "Collaboration & Tools",
      items: [
        {
          href: "/app/collaboration",
          label: "Collaboration Board",
          icon: Share2,
        },
        {
          href: "/app/communities",
          label: "Research Communities",
          icon: Users2,
        },
        {
          href: "/app/interview",
          label: "Author Defense Mock",
          icon: HelpCircle,
        },
        { href: "/app/reports", label: "Reports Hub", icon: FileText },
        { href: "/app/audit-trail", label: "Audit Trail", icon: History },
        { href: "/app/settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setSigningOut(false);
        return;
      }

      router.replace("/auth/login");
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  }

  const brand = (
    <Link
      href="/app/dashboard"
      className="flex items-center gap-2.5"
      aria-label="Dr. Publish dashboard"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
        <BookOpen size={20} />
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-semibold leading-tight tracking-tight text-[#212529]">
          Dr. Publish
        </span>
        <span className="mt-0.5 block text-[10px] font-medium text-gray-500">
          Research workspace
        </span>
      </span>
    </Link>
  );

  const accountPanel = (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-[#F8F9FA] p-2">
      <div className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white"
        >
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-[#212529]">
            {displayName}
          </p>
          <p className="truncate text-[10px] text-gray-500">
            {professionalRole}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        title="Sign out"
        aria-label="Sign out"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LogOut size={16} />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA] text-[#212529] md:flex-row">
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        {brand}

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileMenuOpen}
          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? "flex" : "hidden"
        } fixed inset-x-0 bottom-0 top-[65px] z-30 w-full flex-col overflow-y-auto border-r border-gray-200 bg-white md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0`}
      >
        <div className="hidden border-b border-gray-200 p-4 md:block">
          {brand}
        </div>

        {/* Project selector */}
        <div className="border-b border-gray-200 p-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setProjectDropdownOpen((open) => !open)}
              aria-expanded={projectDropdownOpen}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-[#F8F9FA] p-3 text-left transition hover:bg-gray-100"
            >
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Active manuscript
                </span>
                <span className="mt-1 block truncate text-xs font-semibold text-[#212529]">
                  {currentProject?.title || "No manuscript selected"}
                </span>
              </span>
              <ChevronDown size={16} className="shrink-0 text-gray-500" />
            </button>

            {projectDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 space-y-1 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Switch manuscript
                </p>

                {projects.length > 0 ? (
                  projects.map((project) => (
                    <button
                      type="button"
                      key={project.id}
                      onClick={() => {
                        setCurrentProject(project);
                        setProjectDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                        project.id === currentProject?.id
                          ? "bg-blue-50 font-semibold text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate">{project.title}</span>
                      <span className="shrink-0 text-[10px] text-gray-500">
                        {project.readinessScore}%
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-2 py-3 text-xs text-gray-500">
                    No manuscripts available yet.
                  </p>
                )}

                <div className="border-t border-gray-100 pt-1">
                  <Link
                    href="/app/new-analysis"
                    onClick={() => {
                      setProjectDropdownOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className="block rounded-lg px-2.5 py-2 text-center text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                  >
                    + Create new manuscript
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Workspace navigation"
          className="flex-1 space-y-6 p-3"
        >
          {navSections.map((section) => (
            <section key={section.label}>
              <h2 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {section.label}
              </h2>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-[#212529]"
                      }`}
                    >
                      <Icon size={17} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        {/* Account and sign out */}
        <div className="border-t border-gray-200 bg-white p-3">
          {accountPanel}
          {signingOut && (
            <p role="status" className="mt-2 text-center text-xs text-gray-500">
              Signing out...
            </p>
          )}
        </div>
      </aside>

      {/* Main workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 hidden h-14 items-center justify-between gap-4 border-b border-gray-200 bg-white/95 px-6 backdrop-blur md:flex">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-xs font-medium text-gray-500">
              Manuscript
            </span>
            <span className="max-w-md truncate text-xs font-semibold text-[#212529]">
              {currentProject?.title || "No manuscript selected"}
            </span>

            {currentProject && (
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  currentProject.status === "ready"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-gray-50 text-gray-600"
                }`}
              >
                {currentProject.status.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-4 text-xs">
            {currentProject && (
              <div className="flex items-center gap-2 text-gray-500">
                <span>Readiness score</span>
                <span className="text-sm font-semibold text-blue-600">
                  {currentProject.readinessScore}%
                </span>
              </div>
            )}

            <Link
              href="/app/submission-package"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 font-medium text-white transition hover:bg-blue-700"
            >
              <PackageCheck size={15} />
              Submission package
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
