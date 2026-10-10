'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, CheckCircle2, ArrowRight, BookOpen, Layers } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedFields, setSelectedFields] = useState<string[]>(['Computer Science & AI']);

  const fields = [
    'Computer Science & AI',
    'Biomedical & Life Sciences',
    'Physics & Quantum Computing',
    'Materials Science & Chemistry',
    'Economics & Social Sciences',
    'Environmental Science'
  ];

  const toggleField = (f: string) => {
    if (selectedFields.includes(f)) {
      setSelectedFields(selectedFields.filter((item) => item !== f));
    } else {
      setSelectedFields([...selectedFields, f]);
    }
  };

  return (
    <div className="min-h-screen bg-brand-off-white flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-lg w-full bg-white p-8 rounded-3xl border border-brand-light-gray shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white font-bold mx-auto mb-2">
            <Layers className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-brand-black">Select Your Research Disciplines</h1>
          <p className="text-xs text-brand-gray">
            PaperPilot configures domain-specific peer-review criteria and journal indexers based on your areas of focus.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map((f) => {
            const isSelected = selectedFields.includes(f);
            return (
              <div
                key={f}
                onClick={() => toggleField(f)}
                className={`p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-brand-blue-light/40 border-brand-blue text-brand-blue'
                    : 'bg-white border-brand-light-gray text-brand-dark hover:border-brand-gray'
                }`}
              >
                <span>{f}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0" />}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => router.push('/app/dashboard')}
          className="w-full py-3 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-xs"
        >
          Complete Setup & Go to Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
