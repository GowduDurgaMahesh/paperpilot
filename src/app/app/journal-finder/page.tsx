'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/projectcontext';
import { JournalMatch } from '@/types';
import {
  Search,
  BookOpen,
  Award,
  Clock,
  CheckCircle,
  ExternalLink,
  SlidersHorizontal,
  Check
} from 'lucide-react';

export default function JournalFinderPage() {
  const { currentProject, updateCurrentProject, addAuditLog } = useProject();
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedJournal, setSelectedJournal] = useState(currentProject.targetJournal);

  const indexedJournals: JournalMatch[] = [
    {
      name: 'IEEE Transactions on Neural Networks and Learning Systems',
      publisher: 'IEEE',
      impactFactor: 10.4,
      matchScore: 96,
      acceptanceRate: '14%',
      avgReviewTime: '8 weeks',
      openAccess: false,
      aimsMatch: 'High semantic overlap with deep learning algorithms, quantized architectures, and edge latency optimization.',
      requirements: {
        maxWords: 8500,
        citationStyle: 'IEEE',
        abstractLimit: 250
      }
    },
    {
      name: 'Nature Machine Intelligence',
      publisher: 'Springer Nature',
      impactFactor: 18.8,
      matchScore: 92,
      acceptanceRate: '9%',
      avgReviewTime: '10 weeks',
      openAccess: true,
      aimsMatch: 'Premier multidisciplinary venue for breakthrough neural architectures and foundational learning paradigms.',
      requirements: {
        maxWords: 5000,
        citationStyle: 'Nature',
        abstractLimit: 150
      }
    },
    {
      name: 'ACM Transactions on Embedded Computing Systems (TECS)',
      publisher: 'ACM',
      impactFactor: 3.2,
      matchScore: 90,
      acceptanceRate: '22%',
      avgReviewTime: '6 weeks',
      openAccess: false,
      aimsMatch: 'Specialized focus on low-power hardware execution, memory hierarchy bottlenecks, and edge controllers.',
      requirements: {
        maxWords: 9000,
        citationStyle: 'ACM',
        abstractLimit: 300
      }
    },
    {
      name: 'Neural Networks (Elsevier)',
      publisher: 'Elsevier',
      impactFactor: 7.8,
      matchScore: 88,
      acceptanceRate: '18%',
      avgReviewTime: '7 weeks',
      openAccess: true,
      aimsMatch: 'Strong alignment with theoretical formulations of sparse attention mechanisms and memory efficiency.',
      requirements: {
        maxWords: 8000,
        citationStyle: 'APA',
        abstractLimit: 250
      }
    }
  ];

  const handleSelectTarget = (journal: JournalMatch) => {
    setSelectedJournal(journal.name);
    updateCurrentProject({ targetJournal: journal.name });
    addAuditLog('Updated Target Journal', 'compliance', `Switched target outlet to ${journal.name}`);
  };

  const filtered = indexedJournals.filter((j) =>
    j.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    j.publisher.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black tracking-tight">Smart Journal Finder</h1>
        <p className="text-sm text-brand-gray mt-1">
          NLP-powered semantic alignment comparing your manuscript abstract against 12,000+ indexed publication outlets.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-brand-light-gray shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-brand-gray shrink-0 ml-2" />
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter candidate journals by name, publisher, or field..."
          className="w-full text-xs text-brand-black focus:outline-none"
        />
      </div>

      {/* Journal Cards */}
      <div className="space-y-4">
        {filtered.map((j, idx) => {
          const isTarget = currentProject.targetJournal === j.name;
          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl p-6 border transition-all shadow-sm space-y-4 ${
                isTarget
                  ? 'border-brand-blue ring-1 ring-brand-blue/30'
                  : 'border-brand-light-gray'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">
                      {j.publisher}
                    </span>
                    {j.openAccess && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Open Access Available
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-brand-black">{j.name}</h2>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase text-brand-gray">Semantic Fit</div>
                    <div className="text-xl font-extrabold text-brand-blue">{j.matchScore}%</div>
                  </div>
                  <button
                    onClick={() => handleSelectTarget(j)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isTarget
                        ? 'bg-brand-blue text-white shadow-sm'
                        : 'bg-brand-off-white hover:bg-brand-light-gray text-brand-dark border border-brand-light-gray'
                    }`}
                  >
                    {isTarget && <Check className="w-3.5 h-3.5" />}
                    {isTarget ? 'Target Selected' : 'Set as Target'}
                  </button>
                </div>
              </div>

              <p className="text-xs text-brand-gray leading-relaxed bg-brand-off-white/60 p-3 rounded-xl border border-brand-light-gray">
                <strong className="text-brand-dark block mb-0.5">Aims & Scope Alignment:</strong>
                {j.aimsMatch}
              </p>

              {/* Journal Metrics Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-white border border-brand-light-gray">
                  <span className="text-brand-gray block text-[10px] uppercase font-bold">Impact Factor</span>
                  <span className="font-bold text-brand-black text-sm">{j.impactFactor}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-brand-light-gray">
                  <span className="text-brand-gray block text-[10px] uppercase font-bold">Acceptance Rate</span>
                  <span className="font-bold text-brand-black text-sm">{j.acceptanceRate}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-brand-light-gray">
                  <span className="text-brand-gray block text-[10px] uppercase font-bold">First Decision</span>
                  <span className="font-bold text-brand-black text-sm">{j.avgReviewTime}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-brand-light-gray">
                  <span className="text-brand-gray block text-[10px] uppercase font-bold">Style Format</span>
                  <span className="font-bold text-brand-black text-sm">{j.requirements.citationStyle}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
