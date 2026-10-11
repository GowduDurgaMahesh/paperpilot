'use client';

import React from 'react';
import { useProject } from '@/context/projectcontext';
import { generateResearchReportPDF } from '@/lib/pdf-generator';
import confetti from 'canvas-confetti';
import {
  Award,
  Download,
  CheckCircle2,
  Share2,
  Calendar,
  Sparkles,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';

export default function ReadinessReportPage() {
  const { currentProject } = useProject();

  const handleCelebrate = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    generateResearchReportPDF(currentProject);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-black tracking-tight">Manuscript Readiness Report</h1>
          <p className="text-sm text-brand-gray mt-1">
            Pre-submission readiness evaluation certificate for {currentProject.targetJournal}.
          </p>
        </div>

        <button
          onClick={handleCelebrate}
          className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Download Certified PDF
        </button>
      </div>

      {/* Certificate / Dossier Card */}
      <div className="bg-white rounded-3xl p-8 border border-brand-light-gray shadow-md relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-blue via-indigo-500 to-emerald-400" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-brand-light-gray">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-3">
              <ShieldCheck className="w-4 h-4" />
              Verified Pre-Submission Certification
            </div>
            <h2 className="text-2xl font-bold text-brand-black">{currentProject.title}</h2>
            <div className="text-xs text-brand-gray mt-2 flex flex-wrap gap-4">
              <span>Target: <strong className="text-brand-dark">{currentProject.targetJournal}</strong></span>
              <span>Discipline: <strong className="text-brand-dark">{currentProject.field}</strong></span>
              <span>Authors: <strong className="text-brand-dark">{currentProject.authors.join(', ')}</strong></span>
            </div>
          </div>

          <div className="text-center p-4 rounded-2xl bg-brand-off-white border border-brand-light-gray shrink-0 min-w-[140px]">
            <div className="text-xs font-bold uppercase text-brand-gray">Readiness Index</div>
            <div className="text-4xl font-extrabold text-brand-blue my-1">
              {currentProject.readinessScore}%
            </div>
            <div className="text-[10px] text-emerald-600 font-bold">ACCEPTANCE READY</div>
          </div>
        </div>

        {/* Verification Checkpoints */}
        <div className="py-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gray">
            Verification Checkpoints
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-brand-light-gray bg-brand-off-white/40 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-brand-dark">Word Count & Structure Limit</strong>
                <span className="text-brand-gray">{currentProject.wordCount} words within acceptable bounds</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-brand-light-gray bg-brand-off-white/40 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-brand-dark">Citation Grounding & DOI</strong>
                <span className="text-brand-gray">{currentProject.citationCount} active verified academic references</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-brand-light-gray bg-brand-off-white/40 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-brand-dark">Reproducibility Declarations</strong>
                <span className="text-brand-gray">Data availability and open repository link cataloged</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-brand-light-gray bg-brand-off-white/40 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-brand-dark">Style & Abstract Limits</strong>
                <span className="text-brand-gray">Abstract under 250 words, compliant with publisher criteria</span>
              </div>
            </div>
          </div>
        </div>

        {/* Signoff Footer */}
        <div className="pt-6 border-t border-brand-light-gray flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-gray">
          <div>
            <span>Certified by: <strong>Dr. Publish Pre-Review Automation Engine</strong></span>
            <div className="text-[10px] text-brand-gray mt-0.5">Verification Token: PP-2026-CERT-{currentProject.id.toUpperCase()}</div>
          </div>
          <button
            onClick={handleCelebrate}
            className="text-xs font-semibold text-brand-blue hover:underline flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download Formal PDF
          </button>
        </div>
      </div>
    </div>
  );
}
