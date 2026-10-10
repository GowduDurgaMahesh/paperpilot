'use client';

import React from 'react';
import { useProject } from '@/context/projectcontext';
import {
  Sparkles,
  TrendingUp,
  Lightbulb,
  BookOpen,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export default function ResearchGapPage() {
  const { currentProject, researchGaps } = useProject();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black tracking-tight">Research Gap Explorer</h1>
        <p className="text-sm text-brand-gray mt-1">
          Algorithmic frontier mining identifying unaddressed hypotheses and high-impact academic publication niches.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {researchGaps.map((gap) => (
          <div
            key={gap.id}
            className="bg-white rounded-2xl p-6 border border-brand-light-gray shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {gap.impactPotential} Impact Opportunity
                </span>
                <span className="text-xs text-brand-gray font-mono">
                  {gap.id.toUpperCase()}
                </span>
              </div>

              <h2 className="text-base font-bold text-brand-black">{gap.title}</h2>
              <p className="text-xs text-brand-gray leading-relaxed">{gap.description}</p>

              <div className="p-3.5 rounded-xl bg-brand-off-white border border-brand-light-gray text-xs space-y-1">
                <strong className="block text-brand-black text-[11px] uppercase tracking-wider">
                  Suggested Methodology:
                </strong>
                <p className="text-brand-dark">{gap.suggestedMethodology}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-brand-light-gray flex items-center justify-between text-xs text-brand-gray">
              <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                <BookOpen className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                <span className="truncate">{gap.relatedLiterature.join(', ')}</span>
              </div>
              <button className="text-brand-blue font-semibold hover:underline flex items-center gap-1 shrink-0">
                Explore in arXiv <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
