'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/projectcontext';
import {
  CheckCircle2,
  AlertTriangle,
  Play,
  Award,
  Sparkles,
  Check,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

export default function QualityAnalyzerPage() {
  const { currentProject, qualityMetrics, runAnalysis, isAnalyzing } = useProject();
  const [resolvedRecommendations, setResolvedRecommendations] = useState<Record<string, boolean>>({});

  const toggleResolved = (rec: string) => {
    setResolvedRecommendations((prev) => ({
      ...prev,
      [rec]: !prev[rec],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-black tracking-tight">Manuscript Quality Analyzer</h1>
          <p className="text-sm text-brand-gray mt-1">
            Algorithmic peer-review readiness engine evaluating scholarly validity, structure, and reproducibility.
          </p>
        </div>

        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Re-evaluating Manuscript...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Re-Run Quality Engine
            </>
          )}
        </button>
      </div>

      {/* Metrics List */}
      <div className="space-y-6">
        {qualityMetrics.map((metric, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-2xl border border-brand-light-gray shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {metric.status === 'passed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                )}
                <div>
                  <h2 className="text-sm font-bold text-brand-black">{metric.category}</h2>
                  <div className="text-[11px] text-brand-gray">Evaluation Weight: {Math.round(metric.weight * 100)}%</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-brand-off-white border border-brand-light-gray">
                  {metric.score}/100
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    metric.status === 'passed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {metric.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Score Bar */}
            <div className="w-full bg-brand-light-gray/60 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  metric.score >= 90 ? 'bg-emerald-500' : metric.score >= 80 ? 'bg-brand-blue' : 'bg-amber-500'
                }`}
                style={{ width: `${metric.score}%` }}
              />
            </div>

            {/* Findings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <span className="text-xs font-bold text-brand-dark uppercase tracking-wider block">
                  Positive Validations ({metric.findings.length})
                </span>
                <div className="space-y-1.5">
                  {metric.findings.map((f, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-900 flex items-start gap-2"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-brand-dark uppercase tracking-wider block">
                  Recommended Refinements ({metric.recommendations.length})
                </span>
                {metric.recommendations.length === 0 ? (
                  <div className="p-3 rounded-xl bg-brand-off-white border border-brand-light-gray text-xs text-brand-gray italic">
                    No critical recommendations for this category.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {metric.recommendations.map((rec, i) => {
                      const isDone = !!resolvedRecommendations[rec];
                      return (
                        <div
                          key={i}
                          onClick={() => toggleResolved(rec)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                            isDone
                              ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                              : 'bg-amber-50/40 border-amber-200 text-amber-900 hover:bg-amber-50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                              {isDone ? '✓' : i + 1}
                            </span>
                            <span>{rec}</span>
                          </div>
                          <span className="text-[10px] font-semibold uppercase shrink-0 text-brand-blue">
                            {isDone ? 'Done' : 'Mark Fixed'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
