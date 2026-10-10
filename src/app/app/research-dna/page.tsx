'use client';

import React from 'react';
import { useProject } from '@/context/projectcontext';
import {
  Dna,
  Layers,
  Cpu,
  Compass,
  GitBranch,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function ResearchDNAPage() {
  const { currentProject } = useProject();

  const dnaStrands = [
    {
      category: 'Epistemic Paradigm',
      title: 'Empirical Verification with Formal Bounds',
      description: 'Combines constructive mathematical complexity bounds with physical GPU/Edge hardware inference timing experiments.',
      confidence: 98,
      tags: ['Empirical', 'Hardware-Software Co-Design', 'Algorithmic Pruning']
    },
    {
      category: 'Theoretical Lineage',
      title: 'Sparse Transformer & Attention Compression',
      description: 'Traced to foundational roots in Vaswani et al. (2017) and sparse attention kernels popularized by Dao et al. (FlashAttention).',
      confidence: 94,
      tags: ['Linear Attention', 'Sub-quadratic Complexity', 'Quantization Drift']
    },
    {
      category: 'Novelty Fingerprint',
      title: 'Dynamic Residual Reservoir Buffering',
      description: 'The core novelty lies in dynamically redirecting truncated attention tensors through cached low-rank reservoirs during high-variance tokens.',
      confidence: 91,
      tags: ['Core IP', 'Low-Rank Adaptation', 'Speculative Buffers']
    },
    {
      category: 'Reproducibility Rating',
      title: 'Level 4 (Independent Replication Verified)',
      description: 'Docker image, PyTorch script benchmarks, and synthetic seed datasets are bundled in the repository.',
      confidence: 100,
      tags: ['Zenodo DOI', 'Open Source', 'Deterministic Seeds']
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue-light border border-brand-blue-border text-brand-blue text-xs font-bold mb-2">
          <Dna className="w-3.5 h-3.5" />
          Manuscript Semantic Genome
        </div>
        <h1 className="text-2xl font-bold text-brand-black tracking-tight">Research DNA Blueprint</h1>
        <p className="text-sm text-brand-gray mt-1">
          Deconstructing structural lineage, novelty signatures, and epistemological roots for {currentProject.title}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dnaStrands.map((strand, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-6 border border-brand-light-gray shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-gray uppercase tracking-wider">
                {strand.category}
              </span>
              <span className="text-xs font-mono font-bold text-brand-blue">
                {strand.confidence}% Match
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-brand-black">{strand.title}</h2>
              <p className="text-xs text-brand-gray mt-1 leading-relaxed">{strand.description}</p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {strand.tags.map((t, tIdx) => (
                <span
                  key={tIdx}
                  className="px-2.5 py-1 rounded-lg bg-brand-off-white border border-brand-light-gray text-[11px] font-semibold text-brand-dark"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
