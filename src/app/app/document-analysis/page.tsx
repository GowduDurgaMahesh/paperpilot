'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/projectcontext';
import {
  FileSearch,
  CheckCircle,
  AlertCircle,
  BarChart3,
  AlignLeft,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';

export default function DocumentAnalysisPage() {
  const { currentProject } = useProject();
  const [selectedSection, setSelectedSection] = useState('Introduction');

  const sections = [
    {
      name: 'Introduction',
      score: 91,
      status: 'Passed',
      wordCount: 1420,
      readabilityGrade: '14.8 (Academic standard)',
      passiveVoiceRatio: '24%',
      critique: 'Clear articulation of the research problem with strong motivation. Good historical framing of the problem space.',
      flags: [
        'Paragraph 3 contains three successive long sentences exceeding 35 words.',
        'Clarify the specific empirical hypothesis at the end of the section.'
      ]
    },
    {
      name: 'Methodology',
      score: 96,
      status: 'Excellent',
      wordCount: 2310,
      readabilityGrade: '16.2 (Rigorous technical)',
      passiveVoiceRatio: '32%',
      critique: 'Experimental protocol is exhaustively documented. Statistical testing procedures and baseline configurations are fully specified.',
      flags: [
        'Minor: Add version numbers for libraries used during inference benchmarking.'
      ]
    },
    {
      name: 'Results & Discussion',
      score: 89,
      status: 'Minor Edits',
      wordCount: 2850,
      readabilityGrade: '15.1 (Academic standard)',
      passiveVoiceRatio: '19%',
      critique: 'Results are well-linked to primary hypotheses. Confidence intervals are reported across all benchmark experiments.',
      flags: [
        'Figure 4 description would benefit from explicit p-value annotations.',
        'Discuss contradictory findings observed in baseline cohort 3.'
      ]
    },
    {
      name: 'Conclusion & Impact',
      score: 93,
      status: 'Passed',
      wordCount: 780,
      readabilityGrade: '14.0 (Accessible)',
      passiveVoiceRatio: '15%',
      critique: 'Strong summary of core contributions and insightful future work projections without speculative claims.',
      flags: []
    }
  ];

  const currentSec = sections.find((s) => s.name === selectedSection) || sections[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-black tracking-tight">Document Structure & Text Analysis</h1>
          <p className="text-sm text-brand-gray mt-1">
            Section-by-section linguistic, structural, and methodological decomposition of {currentProject.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-blue-light text-brand-blue border border-brand-blue-border">
            Total Length: {currentProject.wordCount} words
          </span>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-brand-light-gray pb-3">
        {sections.map((sec) => (
          <button
            key={sec.name}
            onClick={() => setSelectedSection(sec.name)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              selectedSection === sec.name
                ? 'bg-brand-blue text-white shadow-sm'
                : 'bg-white text-brand-dark hover:bg-brand-off-white border border-brand-light-gray'
            }`}
          >
            <span>{sec.name}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedSection === sec.name
                  ? 'bg-white/20 text-white'
                  : 'bg-brand-off-white text-brand-gray'
              }`}
            >
              {sec.score}%
            </span>
          </button>
        ))}
      </div>

      {/* Main Section Breakdown Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-brand-light-gray shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-brand-black">{currentSec.name} Evaluation</h2>
                <div className="text-xs text-brand-gray mt-0.5">Section Structural Assessment</div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {currentSec.status}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-brand-off-white border border-brand-light-gray text-xs text-brand-dark leading-relaxed">
              <span className="font-bold text-brand-black block mb-1">Synthesizer Critique:</span>
              {currentSec.critique}
            </div>

            <div>
              <h3 className="text-xs font-bold text-brand-black uppercase tracking-wider mb-3">
                Detected Improvement Flags ({currentSec.flags.length})
              </h3>
              {currentSec.flags.length === 0 ? (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  No critical or stylistic issues detected in this section.
                </div>
              ) : (
                <div className="space-y-2">
                  {currentSec.flags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs text-amber-900 flex items-start gap-2.5"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section Metrics Sidebar */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-brand-light-gray shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-brand-black flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-blue" />
              Linguistic Metrics
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-brand-light-gray">
                <span className="text-brand-gray">Word Count:</span>
                <span className="font-bold text-brand-black">{currentSec.wordCount}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-brand-light-gray">
                <span className="text-brand-gray">Flesch-Kincaid Grade:</span>
                <span className="font-bold text-brand-black">{currentSec.readabilityGrade}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-brand-light-gray">
                <span className="text-brand-gray">Passive Voice Ratio:</span>
                <span className="font-bold text-brand-black">{currentSec.passiveVoiceRatio}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-brand-light-gray">
                <span className="text-brand-gray">Lexical Density:</span>
                <span className="font-bold text-brand-black">64.2%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-brand-gray">Transition Cohesion:</span>
                <span className="font-bold text-emerald-600">High (92%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
