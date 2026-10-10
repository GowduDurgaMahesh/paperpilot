'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle,
  ShieldAlert,
  Search,
  BookOpen,
  Award,
  ArrowRight,
  Sparkles,
  Layers,
  Upload,
  Cpu
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-off-white text-brand-black flex flex-col font-sans">
      {/* Navigation */}
      <header className="border-b border-brand-light-gray bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-sm font-bold text-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-brand-black">PaperPilot</span>
              <span className="ml-1 text-xs px-2 py-0.5 font-semibold bg-brand-blue-light text-brand-blue rounded-full">AI</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-gray">
            <Link href="#features" className="hover:text-brand-blue transition-colors">Capabilities</Link>
            <Link href="#workflow" className="hover:text-brand-blue transition-colors">Workflow</Link>
            <Link href="/app/journal-finder" className="hover:text-brand-blue transition-colors">Journal Finder</Link>
            <Link href="/app/quality-analyzer" className="hover:text-brand-blue transition-colors">Quality Engine</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium px-4 py-2 text-brand-dark hover:text-brand-black transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/app/dashboard"
              className="text-sm font-medium px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              Launch Pilot
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="pt-20 pb-24 px-6 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-blue-light border border-brand-blue-border text-brand-blue text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen Academic Manuscript Readiness & Compliance Engine
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-brand-black max-w-4xl mx-auto leading-tight mb-6">
            From Draft to Acceptance with <span className="text-brand-blue">Algorithmic Precision</span>
          </h1>

          <p className="text-lg md:text-xl text-brand-gray max-w-2xl mx-auto mb-10 leading-relaxed">
            Eliminate desk rejections. PaperPilot AI conducts multi-dimensional pre-review audits, verifies journal compliance guidelines, extracts missing evidence, and packages submission-ready manuscripts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              href="/app/new-analysis"
              className="w-full sm:w-auto px-6 py-3.5 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-base"
            >
              <Upload className="w-5 h-5" />
              Upload Manuscript
            </Link>
            <Link
              href="/app/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-brand-off-white border border-brand-light-gray text-brand-dark font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-base"
            >
              Explore Sample Project
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto text-left">
            <div className="bg-white p-5 rounded-2xl border border-brand-light-gray shadow-sm">
              <div className="text-3xl font-bold text-brand-blue">94%</div>
              <div className="text-xs font-medium text-brand-gray mt-1">First-Pass Compliance Rate</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-brand-light-gray shadow-sm">
              <div className="text-3xl font-bold text-brand-black">12,000+</div>
              <div className="text-xs font-medium text-brand-gray mt-1">Indexed Journal Rulesets</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-brand-light-gray shadow-sm">
              <div className="text-3xl font-bold text-brand-blue">&lt; 30s</div>
              <div className="text-xs font-medium text-brand-gray mt-1">Pre-Review Audit Velocity</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-brand-light-gray shadow-sm">
              <div className="text-3xl font-bold text-brand-black">Zero</div>
              <div className="text-xs font-medium text-brand-gray mt-1">Format-Related Desk Rejections</div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-20 bg-white border-y border-brand-light-gray px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-brand-black mb-4">
                The Complete Pre-Submission Research Operating System
              </h2>
              <p className="text-brand-gray text-base">
                Everything academic scholars, doctoral candidates, and research labs need before clicking submit.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl border border-brand-light-gray bg-brand-off-white/50 hover:border-brand-blue-border transition-all">
                <div className="w-12 h-12 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center mb-5">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-brand-black mb-2">Pre-Review Risk Detection</h3>
                <p className="text-sm text-brand-gray leading-relaxed mb-4">
                  Identify peer-reviewer pushback points before peer review starts. Detect flawed statistical extrapolations, weak baselines, and over-generalizations.
                </p>
                <Link href="/app/pre-review" className="text-xs font-semibold text-brand-blue flex items-center gap-1 hover:underline">
                  Inspect Pre-Review Engine <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-6 rounded-2xl border border-brand-light-gray bg-brand-off-white/50 hover:border-brand-blue-border transition-all">
                <div className="w-12 h-12 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center mb-5">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-brand-black mb-2">Automated Journal Compliance</h3>
                <p className="text-sm text-brand-gray leading-relaxed mb-4">
                  Match against Nature, IEEE, Elsevier, Springer, and ACM guidelines. Automated checks for word counts, figure DPI, abstract limits, and ethical declarations.
                </p>
                <Link href="/app/journal-compliance" className="text-xs font-semibold text-brand-blue flex items-center gap-1 hover:underline">
                  Verify Journal Rules <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-6 rounded-2xl border border-brand-light-gray bg-brand-off-white/50 hover:border-brand-blue-border transition-all">
                <div className="w-12 h-12 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center mb-5">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-brand-black mb-2">Smart Journal Finder</h3>
                <p className="text-sm text-brand-gray leading-relaxed mb-4">
                  NLP similarity embeddings rank top peer-reviewed journals by Impact Factor, acceptance turnaround, open-access policies, and thematic alignment.
                </p>
                <Link href="/app/journal-finder" className="text-xs font-semibold text-brand-blue flex items-center gap-1 hover:underline">
                  Find Target Journals <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-6 rounded-2xl border border-brand-light-gray bg-brand-off-white/50 hover:border-brand-blue-border transition-all">
                <div className="w-12 h-12 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center mb-5">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-brand-black mb-2">Research DNA & Gap Mining</h3>
                <p className="text-sm text-brand-gray leading-relaxed mb-4">
                  Deconstruct your manuscript into foundational paradigms, novel contributions, and open challenges to highlight unaddressed research gaps.
                </p>
                <Link href="/app/research-gap" className="text-xs font-semibold text-brand-blue flex items-center gap-1 hover:underline">
                  Explore Research DNA <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-6 rounded-2xl border border-brand-light-gray bg-brand-off-white/50 hover:border-brand-blue-border transition-all">
                <div className="w-12 h-12 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center mb-5">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-brand-black mb-2">Citation & Evidence Grounding</h3>
                <p className="text-sm text-brand-gray leading-relaxed mb-4">
                  Validate citations against CrossRef, PubMed, and arXiv in real time. Flag phantom citations, outdated references, and broken DOIs.
                </p>
                <Link href="/app/evidence-citations" className="text-xs font-semibold text-brand-blue flex items-center gap-1 hover:underline">
                  Verify Citations <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-6 rounded-2xl border border-brand-light-gray bg-brand-off-white/50 hover:border-brand-blue-border transition-all">
                <div className="w-12 h-12 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center mb-5">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-brand-black mb-2">Instant DOCX & PDF Export</h3>
                <p className="text-sm text-brand-gray leading-relaxed mb-4">
                  Export formatted manuscripts and comprehensive readiness dossiers in one click with built-in DOCX and PDF document synthesis engines.
                </p>
                <Link href="/app/submission-package" className="text-xs font-semibold text-brand-blue flex items-center gap-1 hover:underline">
                  Package Manuscript <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-brand-light-gray py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-brand-gray">
          <div>
            © {new Date().getFullYear()} PaperPilot AI. Developed for researchers, academic faculties, and peer-reviewers worldwide.
          </div>
          <div className="flex gap-6">
            <Link href="/app/dashboard" className="hover:text-brand-blue transition-colors">Workspace</Link>
            <Link href="/app/audit-trail" className="hover:text-brand-blue transition-colors">Audit Trail</Link>
            <Link href="/app/admin" className="hover:text-brand-blue transition-colors">Lab Administration</Link>
            <Link href="/app/settings" className="hover:text-brand-blue transition-colors">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
