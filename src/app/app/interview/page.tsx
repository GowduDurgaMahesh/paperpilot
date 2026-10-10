'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/projectcontext';
import {
  HelpCircle,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Send,
  CheckCircle2
} from 'lucide-react';

export default function InterviewMockPage() {
  const { currentProject } = useProject();
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [authorAnswer, setAuthorAnswer] = useState('');
  const [evaluated, setEvaluated] = useState(false);

  const interviewQuestions = [
    {
      q: 'Why did you select int4 quantization over standard int8 FP16 fallbacks for the edge baseline?',
      critiqueHint: 'Committee members will test if int4 caused unacceptable accuracy drift on edge microcontrollers.',
      idealPoints: [
        'Bandwidth memory bottleneck on SBCs is 4x tighter than desktop GPUs.',
        'Residual error reservoirs prevent divergence under non-stationary token distributions.',
        'Empirical latency benchmarks validate the sub-15ms threshold.'
      ]
    },
    {
      q: 'How does your attention pruning handle out-of-distribution adversarial prompts?',
      critiqueHint: 'Highlight safety degradation modes versus sudden collapse.',
      idealPoints: [
        'Dynamic buffer scales attention span inversely with entropy spikes.',
        'Out-of-distribution inputs automatically trigger high-rank precision fallback.'
      ]
    },
    {
      q: 'What is the primary barrier to commercial industrial adoption of this architecture?',
      critiqueHint: 'Shows practical grounded awareness beyond synthetic test datasets.',
      idealPoints: [
        'Custom FPGA / ASIC register compiler support for dynamic sparsity.',
        'Real-time thermal throttling fluctuations in continuous deployments.'
      ]
    }
  ];

  const currentQ = interviewQuestions[activeQuestion];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorAnswer.trim()) return;
    setEvaluated(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue-light border border-brand-blue-border text-brand-blue text-xs font-bold mb-2">
          <HelpCircle className="w-3.5 h-3.5" />
          Editorial Defense Simulator
        </div>
        <h1 className="text-2xl font-bold text-brand-black tracking-tight">Author Defense & Viva Mock</h1>
        <p className="text-sm text-brand-gray mt-1">
          Prepare for tough committee questioning and journal editorial review boards for {currentProject.title}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions list */}
        <div className="space-y-2">
          {interviewQuestions.map((q, idx) => (
            <div
              key={idx}
              onClick={() => {
                setActiveQuestion(idx);
                setEvaluated(false);
                setAuthorAnswer('');
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activeQuestion === idx
                  ? 'bg-brand-blue text-white shadow-sm font-semibold'
                  : 'bg-white border-brand-light-gray text-brand-dark hover:bg-brand-off-white'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-1">
                Question {idx + 1}
              </div>
              <div className="text-xs leading-snug">{q.q}</div>
            </div>
          ))}
        </div>

        {/* Active Q&A card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-brand-light-gray shadow-sm space-y-5">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue">
              Reviewer Board Question #{activeQuestion + 1}
            </span>
            <h2 className="text-base font-bold text-brand-black">{currentQ.q}</h2>
            <div className="p-3 rounded-xl bg-brand-off-white border border-brand-light-gray text-xs text-brand-gray italic">
              <strong>Context & Intent:</strong> {currentQ.critiqueHint}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-xs font-bold text-brand-dark">
              Your Defended Explanation:
            </label>
            <textarea
              rows={4}
              value={authorAnswer}
              onChange={(e) => setAuthorAnswer(e.target.value)}
              placeholder="Structure your defense citing theoretical guarantees and empirical metrics..."
              className="w-full p-3.5 rounded-xl border border-brand-light-gray text-xs focus:outline-none focus:border-brand-blue"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!authorAnswer.trim()}
                className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Evaluate Defense Readiness
              </button>
            </div>
          </form>

          {evaluated && (
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Defense Evaluator Assessment: Cohesive & Defensible</span>
              </div>
              <p className="text-emerald-950 leading-relaxed">
                Your response touches on the core technical tradeoffs. Ensure you also cite the specific empirical tables during live defense:
              </p>
              <div className="space-y-1">
                {currentQ.idealPoints.map((pt, i) => (
                  <div key={i} className="flex items-center gap-2 text-emerald-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
