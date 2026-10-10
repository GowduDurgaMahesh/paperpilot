'use client';

import React from 'react';
import { useProject } from '@/context/projectcontext';
import { generateResearchReportPDF } from '@/lib/pdf-generator';
import { generateManuscriptDocx } from '@/lib/docx-generator';
import {
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  Award
} from 'lucide-react';

export default function ReportsHubPage() {
  const { currentProject, projects } = useProject();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-black tracking-tight">Reports & Export Archive</h1>
          <p className="text-sm text-brand-gray mt-1">
            Access certified evaluation dossiers, compliance audits, and manuscript drafts.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-light-gray shadow-sm overflow-hidden">
        <div className="p-4 border-b border-brand-light-gray font-bold text-xs text-brand-black">
          Archived Manuscript Reports
        </div>

        <div className="divide-y divide-brand-light-gray">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-brand-off-white/40 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-black">{proj.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-blue-light text-brand-blue">
                    {proj.readinessScore}% Score
                  </span>
                </div>
                <div className="text-xs text-brand-gray">
                  Target: <strong>{proj.targetJournal}</strong> | Updated: {new Date(proj.updatedAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateResearchReportPDF(proj)}
                  className="px-3.5 py-1.5 bg-brand-off-white hover:bg-brand-light-gray text-brand-dark rounded-xl text-xs font-semibold border border-brand-light-gray flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF Dossier
                </button>
                <button
                  onClick={() => generateManuscriptDocx(proj)}
                  className="px-3.5 py-1.5 bg-brand-off-white hover:bg-brand-light-gray text-brand-dark rounded-xl text-xs font-semibold border border-brand-light-gray flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  DOCX
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
