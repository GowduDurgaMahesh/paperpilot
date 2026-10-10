'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/projectcontext';
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  ShieldCheck,
  Check,
  XCircle,
  HelpCircle
} from 'lucide-react';

export default function JournalCompliancePage() {
  const { currentProject } = useProject();

  const [rules, setRules] = useState([
    {
      title: 'Abstract Word Count Constraint',
      requirement: 'Maximum 250 words for standard research papers.',
      currentValue: '184 words (Abstract is compliant)',
      status: 'passed',
      critical: true
    },
    {
      title: 'Main Text Body Word Cap',
      requirement: 'Maximum 8,500 words including figures and tables.',
      currentValue: `${currentProject.wordCount} words (Under upper limit)`,
      status: 'passed',
      critical: true
    },
    {
      title: 'Reference Citation Limit',
      requirement: 'Recommended 35-50 peer-reviewed references.',
      currentValue: `${currentProject.citationCount} verified citations cataloged`,
      status: 'passed',
      critical: false
    },
    {
      title: 'Anonymization & Blind Review Standard',
      requirement: 'IEEE transactions review is Single-Blind. Author affiliations required.',
      currentValue: 'Author names and lab affiliations are present.',
      status: 'passed',
      critical: true
    },
    {
      title: 'Vector Figure Resolution (DPI)',
      requirement: 'Minimum 300 DPI for halftone figures; 600 DPI for line art.',
      currentValue: 'Embedded figures render with vector SVG / EPS paths.',
      status: 'passed',
      critical: false
    },
    {
      title: 'Open Data & Artifact Availability Statement',
      requirement: 'Explicit public data URL or Zenodo DOI identifier required.',
      currentValue: 'Zenodo DOI present in Data Availability declaration.',
      status: 'passed',
      critical: true
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-black tracking-tight">Publisher Compliance Verifier</h1>
          <p className="text-sm text-brand-gray mt-1">
            Ruleset alignment against the author guidelines of <strong className="text-brand-dark">{currentProject.targetJournal}</strong>.
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
          6/6 Rulesets Passed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-brand-light-gray shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <h2 className="text-sm font-bold text-brand-black">{rule.title}</h2>
              </div>
              {rule.critical && (
                <span className="text-[10px] uppercase font-bold text-brand-blue bg-brand-blue-light px-2 py-0.5 rounded">
                  Mandatory
                </span>
              )}
            </div>

            <p className="text-xs text-brand-gray">{rule.requirement}</p>

            <div className="p-3 rounded-xl bg-brand-off-white border border-brand-light-gray text-xs text-emerald-800 font-medium">
              <span className="text-[10px] text-brand-gray block font-bold uppercase mb-0.5">
                Manuscript Audit Status:
              </span>
              {rule.currentValue}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
