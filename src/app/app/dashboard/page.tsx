'use client';

import React from 'react';
import Link from 'next/link';
import { useProject } from '@/context/projectcontext';
import { generateResearchReportPDF } from '@/lib/pdf-generator';
import { generateManuscriptDocx } from '@/lib/docx-generator';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Play,
  Download,
  FileText,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  History,
  ShieldCheck
} from 'lucide-react';

export default function DashboardPage() {
  const { currentProject, qualityMetrics, runAnalysis, isAnalyzing, auditLogs, researchGaps } = useProject();

  const handleDownloadPDF = () => {
    generateResearchReportPDF(currentProject);
  };

  const handleDownloadDocx = () => {
    generateManuscriptDocx(currentProject);
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Manuscript Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-brand-light-gray shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-blue-light text-brand-blue border border-brand-blue-border">
              {currentProject.field}
            </span>
            <span className="text-xs text-brand-gray flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Last evaluated: {new Date(currentProject.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-brand-black tracking-tight leading-snug">
            {currentProject.title}
          </h1>
          <p className="text-sm text-brand-gray line-clamp-2">
            {currentProject.abstract}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="w-full sm:w-auto px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Auditing Manuscript...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Pre-Review Audit
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPDF}
            className="w-full sm:w-auto px-3.5 py-2.5 bg-brand-off-white hover:bg-brand-light-gray border border-brand-light-gray text-brand-dark rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            PDF Dossier
          </button>

          <button
            onClick={handleDownloadDocx}
            className="w-full sm:w-auto px-3.5 py-2.5 bg-brand-off-white hover:bg-brand-light-gray border border-brand-light-gray text-brand-dark rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-3.5 h-3.5" />
            Export DOCX
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Readiness Score */}
        <div className="bg-white p-5 rounded-2xl border border-brand-light-gray shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-brand-gray">Readiness Composite</div>
            <div className="text-3xl font-extrabold text-brand-blue mt-1">
              {currentProject.readinessScore}%
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Ready for submission review
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-blue-light text-brand-blue flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Word Count & Structure */}
        <div className="bg-white p-5 rounded-2xl border border-brand-light-gray shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-brand-gray">Total Word Count</div>
            <div className="text-3xl font-extrabold text-brand-black mt-1">
              {currentProject.wordCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-brand-gray mt-1">
              Limit: 8,500 max (compliant)
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Verified Citations */}
        <div className="bg-white p-5 rounded-2xl border border-brand-light-gray shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-brand-gray">Verified References</div>
            <div className="text-3xl font-extrabold text-brand-black mt-1">
              {currentProject.citationCount}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> 100% DOI resolution
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Target Journal Match */}
        <div className="bg-white p-5 rounded-2xl border border-brand-light-gray shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-brand-gray">Target Outlet</div>
            <div className="text-sm font-bold text-brand-black mt-1 truncate max-w-[140px]">
              {currentProject.targetJournal}
            </div>
            <div className="text-[11px] text-brand-blue font-semibold mt-1">
              IEEE Style Pack Active
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Quality Metrics + Research Gaps & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quality Metrics Column (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-brand-light-gray shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-brand-black">Pre-Review Evaluation Matrix</h2>
                <p className="text-xs text-brand-gray mt-0.5">Automated assessment across 5 core academic publication vectors</p>
              </div>
              <Link
                href="/app/quality-analyzer"
                className="text-xs font-semibold text-brand-blue flex items-center gap-1 hover:underline"
              >
                Deep Inspection <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {qualityMetrics.map((qm, i) => (
                <div key={i} className="p-4 rounded-xl border border-brand-light-gray bg-brand-off-white/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {qm.status === 'passed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="text-xs font-bold text-brand-black">{qm.category}</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-brand-dark">
                      {qm.score}/100
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-brand-light-gray/60 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        qm.score >= 90 ? 'bg-emerald-500' : qm.score >= 80 ? 'bg-brand-blue' : 'bg-amber-500'
                      }`}
                      style={{ width: `${qm.score}%` }}
                    />
                  </div>

                  {/* Findings Snippet */}
                  <div className="text-[11px] text-brand-gray">
                    <span className="font-semibold text-brand-dark">Key Finding:</span> {qm.findings[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Research Gaps Section */}
          <div className="bg-white rounded-2xl p-6 border border-brand-light-gray shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-blue" />
                <h2 className="text-base font-bold text-brand-black">Detected Novelty & Research Gaps</h2>
              </div>
              <Link
                href="/app/research-gap"
                className="text-xs font-semibold text-brand-blue flex items-center gap-1 hover:underline"
              >
                View All Gaps <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {researchGaps.map((gap) => (
                <div key={gap.id} className="p-3.5 rounded-xl border border-brand-light-gray bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-brand-black">{gap.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      {gap.impactPotential} Impact Opportunity
                    </span>
                  </div>
                  <p className="text-xs text-brand-gray leading-relaxed">{gap.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Audit Logs */}
        <div className="space-y-6">
          {/* Quick Action Navigator */}
          <div className="bg-white rounded-2xl p-6 border border-brand-light-gray shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-brand-black">Accelerated Actions</h2>
            <div className="space-y-2">
              <Link
                href="/app/pre-review"
                className="flex items-center justify-between p-3 rounded-xl border border-brand-light-gray hover:border-brand-blue hover:bg-brand-blue-light/30 transition-all text-xs font-semibold text-brand-dark"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-brand-blue" />
                  <span>Pre-Review Adversarial Simulation</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-brand-gray" />
              </Link>

              <Link
                href="/app/journal-compliance"
                className="flex items-center justify-between p-3 rounded-xl border border-brand-light-gray hover:border-brand-blue hover:bg-brand-blue-light/30 transition-all text-xs font-semibold text-brand-dark"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-brand-blue" />
                  <span>Verify Journal Guidelines</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-brand-gray" />
              </Link>

              <Link
                href="/app/evidence-citations"
                className="flex items-center justify-between p-3 rounded-xl border border-brand-light-gray hover:border-brand-blue hover:bg-brand-blue-light/30 transition-all text-xs font-semibold text-brand-dark"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-brand-blue" />
                  <span>Validate Citation Integrity</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-brand-gray" />
              </Link>

              <Link
                href="/app/submission-package"
                className="flex items-center justify-between p-3 rounded-xl border border-brand-light-gray hover:border-brand-blue hover:bg-brand-blue-light/30 transition-all text-xs font-semibold text-brand-dark"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-brand-blue" />
                  <span>Generate Final Submission Zip</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-brand-gray" />
              </Link>
            </div>
          </div>

          {/* Audit Trail Mini Feed */}
          <div className="bg-white rounded-2xl p-6 border border-brand-light-gray shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-brand-gray" />
                <h2 className="text-sm font-bold text-brand-black">Project Audit Log</h2>
              </div>
              <Link href="/app/audit-trail" className="text-[11px] font-semibold text-brand-blue hover:underline">
                Full Trail
              </Link>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="text-xs pb-2 border-b border-brand-light-gray last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-[10px] text-brand-gray mb-1">
                    <span className="font-semibold text-brand-dark">{log.action}</span>
                    <span>{log.timestamp.substring(11, 16)}</span>
                  </div>
                  <div className="text-[11px] text-brand-gray truncate">{log.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
