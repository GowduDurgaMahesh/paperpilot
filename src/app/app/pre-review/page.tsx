'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/projectcontext';
import {
  ShieldAlert,
  UserCheck,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2
} from 'lucide-react';

export default function PreReviewEnginePage() {
  const { currentProject } = useProject();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const simulatedReviews = [
    {
      reviewer: 'Reviewer #1 (Methodological Specialist)',
      stance: 'Minor Revision',
      stanceColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      summary: 'Strong technical execution with thorough empirical benchmarks. However, the evaluation on quantized edge hardware relies on simulated latency profiles rather than physical oscilloscope power telemetry.',
      concerns: [
        {
          point: 'Hardware Temperature & Power Telemetry',
          detail: 'Section 4.1 claims low-power operation, but does not provide milliwatt per inference measurements across varying junction temperatures.',
          suggestedRebuttal: 'Include thermal dissipation metrics in Table 3 using standard jetson-stats / power-rail logging.'
        },
        {
          point: 'Baseline Recency',
          detail: 'The benchmark comparisons primarily focus on 2022-2023 models. A comparison against 2025 MobileLLM architectures would reinforce claims.',
          suggestedRebuttal: 'Cite MobileLLM-v2 in Section 2 and clarify that memory bandwidth limitations match the theoretical bounds.'
        }
      ]
    },
    {
      reviewer: 'Reviewer #2 (Theoretical & Formal Foundations)',
      stance: 'Accept with Clarifications',
      stanceColor: 'text-blue-700 bg-blue-50 border-blue-200',
      summary: 'The mathematical formulation in Theorem 1 is sound and provides a welcome formalization for attention pruning under budget constraints.',
      concerns: [
        {
          point: 'Notation Uniformity',
          detail: 'Variable theta is used both for model weights in Equation 2 and temperature hyperparameter in Equation 6.',
          suggestedRebuttal: 'Rename temperature scaling hyperparameter to tau to avoid notation collision.'
        }
      ]
    },
    {
      reviewer: 'Reviewer #3 (Domain Application & Impact)',
      stance: 'Minor Revision',
      stanceColor: 'text-amber-700 bg-amber-50 border-amber-200',
      summary: 'The manuscript presents an impactful solution for real-world robotics and autonomous systems. Discussion of ethical risks and safety fallbacks should be expanded.',
      concerns: [
        {
          point: 'Safety Fallbacks under OOD Inputs',
          detail: 'When the attention budget is heavily truncated, what is the failure behavior under adversarial or out-of-distribution inputs?',
          suggestedRebuttal: 'Add a 2-paragraph discussion in Section 5.3 outlining the safe graceful degradation mode.'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Adversarial Peer Review Simulator
        </div>
        <h1 className="text-2xl font-bold text-brand-black tracking-tight">Pre-Review Risk Assessment</h1>
        <p className="text-sm text-brand-gray mt-1">
          Anticipate reviewer objections and prepare proactive rebuttals before submission to {currentProject.targetJournal}.
        </p>
      </div>

      <div className="space-y-4">
        {simulatedReviews.map((rev, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-brand-light-gray shadow-sm overflow-hidden"
            >
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-brand-off-white/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-off-white text-brand-dark flex items-center justify-center font-bold text-xs border border-brand-light-gray">
                    R{idx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-black">{rev.reviewer}</h3>
                    <div className="text-xs text-brand-gray">{rev.concerns.length} anticipated critique points</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${rev.stanceColor}`}>
                    {rev.stance}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-brand-gray" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-brand-gray" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-brand-light-gray space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-brand-off-white text-brand-dark leading-relaxed">
                    <strong className="block text-brand-black mb-1">Overall Assessment:</strong>
                    {rev.summary}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-brand-dark uppercase tracking-wider text-[11px]">
                      Specific Criticisms & Recommended Author Action
                    </h4>
                    {rev.concerns.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-4 rounded-xl border border-brand-light-gray bg-white space-y-2"
                      >
                        <div className="flex items-center gap-2 text-amber-800 font-bold">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{c.point}</span>
                        </div>
                        <p className="text-brand-gray leading-relaxed">{c.detail}</p>
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900">
                          <strong className="text-emerald-950 block mb-0.5">Recommended Pre-Submission Edit:</strong>
                          {c.suggestedRebuttal}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
