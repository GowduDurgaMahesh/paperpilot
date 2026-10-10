'use client';

import React from 'react';
import {
  Users2,
  Globe,
  BookOpen,
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function CommunitiesPage() {
  const communities = [
    {
      name: 'IEEE Computational Intelligence Society',
      members: '18,400+ Members',
      topics: ['Neural Networks', 'Pruning', 'Hardware Acceleration'],
      description: 'Global community of researchers and IEEE Fellows advancing neural computation and edge learning architectures.'
    },
    {
      name: 'arXiv Open Machine Learning Working Group',
      members: '32,000+ Researchers',
      topics: ['Preprints', 'Reproducibility', 'LLM Compression'],
      description: 'Decentralized group discussing early-stage preprints, peer evaluations, and benchmark reproducibility.'
    },
    {
      name: 'ACM SIGBED (Embedded Systems)',
      members: '9,200+ Members',
      topics: ['Low-Power Systems', 'Microcontrollers', 'Real-Time Edge'],
      description: 'Focusing on hardware-software codesign, real-time constraints, and edge AI microprocessors.'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black tracking-tight">Research Communities</h1>
        <p className="text-sm text-brand-gray mt-1">
          Connect with specialized academic associations and disciplinary working groups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {communities.map((comm, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-6 border border-brand-light-gray shadow-sm flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center">
                <Users2 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-brand-black">{comm.name}</h2>
              <div className="text-xs font-semibold text-brand-blue">{comm.members}</div>
              <p className="text-xs text-brand-gray leading-relaxed">{comm.description}</p>
            </div>

            <div className="space-y-3 pt-2 border-t border-brand-light-gray">
              <div className="flex flex-wrap gap-1">
                {comm.topics.map((t, tIdx) => (
                  <span
                    key={tIdx}
                    className="text-[10px] bg-brand-off-white text-brand-dark px-2 py-0.5 rounded border border-brand-light-gray font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <button className="w-full py-2 bg-brand-off-white hover:bg-brand-blue hover:text-white rounded-xl text-xs font-semibold transition-all border border-brand-light-gray flex items-center justify-center gap-1.5">
                Join Community Hub <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
