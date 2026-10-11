
'use client';

import Link from 'next/link';
import {
  Award,
  AlertTriangle,
  Play,
  Download,
  FileText,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  History,
  ShieldCheck,
} from 'lucide-react';

import { useProject } from '@/context/projectcontext';
import { generateResearchReportPDF } from '@/lib/pdf-generator';
import { generateManuscriptDocx } from '@/lib/docx-generator';

export default function DashboardPage() {
  const {
    currentProject,
    projects,
    qualityMetrics,
    runAnalysis,
    isAnalyzing,
    auditLogs,
    researchGaps,
  } = useProject();

  const hasProject = Boolean(currentProject.id);
  const hasMetrics = qualityMetrics.length > 0;
  const hasEvaluatedProject =
    hasProject && (currentProject.updatedAt !== currentProject.createdAt);

  const handleDownloadPDF = () => {
    if (hasProject) generateResearchReportPDF(currentProject);
  };

  const handleDownloadDocx = () => {
    if (hasProject) generateManuscriptDocx(currentProject);
  };

  const cardClass =
    'rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm';
  const mutedClass = 'text-sm text-[#6B7280]';

  return (
    <main className="space-y-6 text-[#212529]">
      <section className="flex flex-col gap-5 rounded-2xl border border-[#E5E7EB] bg-white p-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-medium text-[#6B7280]">
            Dr. Publish · Research workspace
          </p>

          {hasProject ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
                {currentProject.field && (
                  <span className="rounded-full border border-[#E5E7EB] px-2.5 py-1">
                    {currentProject.field}
                  </span>
                )}
                {currentProject.updatedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Updated{' '}
                    {new Date(currentProject.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <h1 className="break-words text-2xl font-bold tracking-tight">
                {currentProject.title || 'Untitled manuscript'}
              </h1>

              <p className="max-w-2xl text-sm leading-6 text-[#6B7280]">
                {currentProject.abstract ||
                  'Add an abstract and manuscript content to get started.'}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight">
                Your research workspace
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[#6B7280]">
                Create a manuscript project to organize your research,
                citations, reports and publication preparation.
              </p>
            </>
          )}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row md:w-auto md:flex-wrap">
          {!hasProject ? (
            <Link
              href="/app/new-analysis"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              <FileText className="h-4 w-4" />
              Create manuscript
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void runAnalysis()}
                disabled={isAnalyzing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {isAnalyzing ? 'Processing…' : 'Request pre-review'}
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] px-3 py-3 text-sm font-medium hover:bg-[#F8F9FA]"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </button>

              <button
                type="button"
                onClick={handleDownloadDocx}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] px-3 py-3 text-sm font-medium hover:bg-[#F8F9FA]"
              >
                <FileText className="h-4 w-4" />
                Export DOCX
              </button>
            </>
          )}
        </div>
      </section>

      {!hasProject && (
        <section className={`${cardClass} space-y-3`}>
          <h2 className="font-semibold">No manuscript selected</h2>
          <p className={mutedClass}>
            Your saved projects will appear here when available. Start a
            project to begin organizing your work.
          </p>
          <Link
            href="/app/new-analysis"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:underline"
          >
            Start a project <ArrowRight className="h-4 w-4" />
          </Link>
          {projects.length === 0 && (
            <p className="text-xs text-[#6B7280]">
              No saved projects were returned for your account.
            </p>
          )}
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={cardClass}>
          <p className={mutedClass}>Readiness score</p>
          <p className="mt-2 text-3xl font-bold">
            {hasProject && hasEvaluatedProject
              ? `${currentProject.readinessScore}%`
              : '—'}
          </p>
          <p className="mt-2 text-xs text-[#6B7280]">
            {hasProject && hasEvaluatedProject
              ? 'Stored project score; its analysis status should be verified.'
              : 'No confirmed evaluation available.'}
          </p>
        </div>

        <div className={cardClass}>
          <p className={mutedClass}>Word count</p>
          <p className="mt-2 text-3xl font-bold">
            {hasProject
              ? currentProject.wordCount.toLocaleString()
              : '—'}
          </p>
          <p className="mt-2 text-xs text-[#6B7280]">
            {hasProject
              ? 'Stored manuscript count; no journal limit assumed.'
              : 'Select or create a manuscript.'}
          </p>
        </div>

        <div className={cardClass}>
          <p className={mutedClass}>Citations</p>
          <p className="mt-2 text-3xl font-bold">
            {hasProject ? currentProject.citationCount : '—'}
          </p>
          <p className="mt-2 text-xs text-[#6B7280]">
            Stored citation count. DOI verification is not inferred.
          </p>
        </div>

        <div className={cardClass}>
          <p className={mutedClass}>Target journal</p>
          <p className="mt-2 break-words text-lg font-semibold">
            {hasProject && currentProject.targetJournal
              ? currentProject.targetJournal
              : 'Not selected'}
          </p>
          <p className="mt-2 text-xs text-[#6B7280]">
            Journal formatting and compliance must be verified separately.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className={`${cardClass} space-y-4`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Quality assessment</h2>
                <p className={`mt-1 ${mutedClass}`}>
                  Results saved for the selected manuscript.
                </p>
              </div>
              <Link
                href="/app/quality-analyzer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB] hover:underline"
              >
                Open analyzer <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {!hasProject || !hasMetrics ? (
              <div className="rounded-xl border border-dashed border-[#D1D5DB] p-5">
                <AlertTriangle className="mb-2 h-5 w-5 text-[#6B7280]" />
                <p className="font-medium">No saved assessment results</p>
                <p className={`mt-1 ${mutedClass}`}>
                  Quality scores will appear here when results are available.
                  This dashboard does not generate or fabricate scores.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {qualityMetrics.map((metric, index) => {
                  const score = Math.max(
                    0,
                    Math.min(100, Number(metric.score) || 0)
                  );

                  return (
                    <div
                      key={`${metric.category}-${index}`}
                      className="space-y-2 rounded-xl border border-[#E5E7EB] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">
                          {metric.category}
                        </span>
                        <span className="text-sm font-semibold tabular-nums">
                          {score}/100
                        </span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-full bg-[#F3F4F6]"
                        role="progressbar"
                        aria-label={`${metric.category} score`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={score}
                      >
                        <div
                          className="h-full rounded-full bg-[#2563EB]"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      {metric.findings?.[0] && (
                        <p className={`text-sm ${mutedClass}`}>
                          {metric.findings[0]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className={`${cardClass} space-y-4`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#2563EB]" />
                <h2 className="font-semibold">Research gaps</h2>
              </div>
              <Link
                href="/app/research-gap"
                className="text-sm font-semibold text-[#2563EB] hover:underline"
              >
                View section
              </Link>
            </div>

            {researchGaps.length === 0 ? (
              <p className={mutedClass}>
                No saved research gaps are available for this project yet.
              </p>
            ) : (
              <div className="space-y-3">
                {researchGaps.map((gap) => (
                  <article
                    key={gap.id}
                    className="rounded-xl border border-[#E5E7EB] p-4"
                  >
                    <h3 className="text-sm font-semibold">{gap.title}</h3>
                    <p className={`mt-2 ${mutedClass}`}>
                      {gap.description}
                    </p>
                    <p className="mt-2 text-xs text-[#6B7280]">
                      Impact potential: {gap.impactPotential}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className={`${cardClass} space-y-3`}>
            <h2 className="font-semibold">Research tools</h2>
            {[
              {
                href: '/app/pre-review',
                label: 'Pre-review workspace',
                icon: ShieldCheck,
              },
              {
                href: '/app/journal-compliance',
                label: 'Journal guidelines',
                icon: Layers,
              },
              {
                href: '/app/evidence-citations',
                label: 'Citation integrity',
                icon: BookOpen,
              },
              {
                href: '/app/submission-package',
                label: 'Submission package',
                icon: Award,
              },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] p-3 text-sm font-medium hover:bg-[#F8F9FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[#2563EB]" />
                  {label}
                </span>
                <ArrowRight className="h-4 w-4 text-[#6B7280]" />
              </Link>
            ))}
          </section>

          <section className={`${cardClass} space-y-4`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-[#6B7280]" />
                <h2 className="font-semibold">Recent activity</h2>
              </div>
              <Link
                href="/app/audit-trail"
                className="text-sm font-semibold text-[#2563EB] hover:underline"
              >
                View all
              </Link>
            </div>

            {auditLogs.length === 0 ? (
              <p className={mutedClass}>
                No saved activity is available for this project yet.
              </p>
            ) : (
              <div className="space-y-3">
                {auditLogs.slice(0, 4).map((log) => (
                  <article
                    key={log.id}
                    className="border-b border-[#E5E7EB] pb-3 last:border-0 last:pb-0"
                  >
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className={`mt-1 break-words text-xs ${mutedClass}`}>
                      {log.details}
                    </p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      {log.timestamp}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}
