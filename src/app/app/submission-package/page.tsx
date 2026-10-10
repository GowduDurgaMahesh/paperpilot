'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/projectcontext';
import { generateManuscriptDocx } from '@/lib/docx-generator';
import { generateResearchReportPDF } from '@/lib/pdf-generator';
import {
  PackageCheck,
  Download,
  FileText,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SubmissionPackagePage() {
  const { currentProject } = useProject();
  const [editorName, setEditorName] = useState('Editor-in-Chief');
  const [coverLetterGenerated, setCoverLetterGenerated] = useState(true);

  const coverLetterText = `Dear ${editorName},

Please find enclosed our manuscript entitled "${currentProject.title}", which we submit for consideration as an original research article in ${currentProject.targetJournal}.

In this work, we address fundamental latency and memory bottlenecks in edge computing by introducing a sparse recurrent attention pruning mechanism. We believe this contribution aligns squarely with the scope and readership of ${currentProject.targetJournal}.

This manuscript has not been published elsewhere, nor is it currently under consideration by any other journal. All authors have approved the manuscript and agree with its submission.

Sincerely,
${currentProject.authors.join(', ')}`;

  const handleDownloadAll = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });
    generateManuscriptDocx(currentProject);
    setTimeout(() => {
      generateResearchReportPDF(currentProject);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-black tracking-tight">Final Submission Package</h1>
          <p className="text-sm text-brand-gray mt-1">
            Bundle all required publisher artifacts for direct submission to {currentProject.targetJournal}.
          </p>
        </div>

        <button
          onClick={handleDownloadAll}
          className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Package (DOCX + PDF)
        </button>
      </div>

      {/* Package Manifest Checklist */}
      <div className="bg-white p-6 rounded-2xl border border-brand-light-gray shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-brand-black flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-brand-blue" />
          Submission Artifact Manifest
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-brand-light-gray bg-brand-off-white/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div>
                <strong className="block text-brand-black">Primary Manuscript File</strong>
                <span className="text-brand-gray">Ready (.docx & .pdf formats)</span>
              </div>
            </div>
            <button
              onClick={() => generateManuscriptDocx(currentProject)}
              className="text-brand-blue font-semibold hover:underline"
            >
              Export
            </button>
          </div>

          <div className="p-3.5 rounded-xl border border-brand-light-gray bg-brand-off-white/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div>
                <strong className="block text-brand-black">Readiness Verification Dossier</strong>
                <span className="text-brand-gray">Audit certificate for reviewers</span>
              </div>
            </div>
            <button
              onClick={() => generateResearchReportPDF(currentProject)}
              className="text-brand-blue font-semibold hover:underline"
            >
              Export
            </button>
          </div>

          <div className="p-3.5 rounded-xl border border-brand-light-gray bg-brand-off-white/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div>
                <strong className="block text-brand-black">Author Title Page & Affiliations</strong>
                <span className="text-brand-gray">All co-author metadata formatted</span>
              </div>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
              Attached
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-brand-light-gray bg-brand-off-white/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div>
                <strong className="block text-brand-black">Data Availability Statement</strong>
                <span className="text-brand-gray">Zenodo DOI cataloged</span>
              </div>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
              Attached
            </span>
          </div>
        </div>
      </div>

      {/* Automated Cover Letter */}
      <div className="bg-white p-6 rounded-2xl border border-brand-light-gray shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-brand-blue" />
            <h2 className="text-sm font-bold text-brand-black">Automated Editorial Cover Letter</h2>
          </div>
          <span className="text-[11px] text-brand-gray font-mono">Target: {currentProject.targetJournal}</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-brand-dark mb-1">Editor In-Charge / Title</label>
          <input
            type="text"
            value={editorName}
            onChange={(e) => setEditorName(e.target.value)}
            className="w-full max-w-sm px-3 py-1.5 rounded-xl border border-brand-light-gray text-xs focus:outline-none focus:border-brand-blue"
          />
        </div>

        <div className="p-4 rounded-xl bg-brand-off-white border border-brand-light-gray">
          <pre className="text-xs font-mono text-brand-dark whitespace-pre-wrap leading-relaxed">
            {coverLetterText}
          </pre>
        </div>
      </div>
    </div>
  );
}
