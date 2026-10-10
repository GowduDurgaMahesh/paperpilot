'use client';

import React from 'react';
import {
  ShieldAlert,
  Server,
  Key,
  Users,
  Database,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black tracking-tight">Research Lab Administration</h1>
        <p className="text-sm text-brand-gray mt-1">
          Compute clusters, data residency controls, and academic indexing connectors.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-brand-light-gray shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-brand-black">Analysis Compute Cluster</h2>
          <div className="text-xs text-brand-gray">Status: <strong className="text-emerald-600">Operational</strong></div>
          <p className="text-xs text-brand-gray">Dedicated GPU/CPU nodes allocated for semantic embeddings and pre-checks.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-brand-light-gray shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-brand-black">Academic API Connectors</h2>
          <div className="text-xs text-brand-gray">CrossRef: <strong className="text-emerald-600">Connected</strong></div>
          <div className="text-xs text-brand-gray">arXiv Semantic API: <strong className="text-emerald-600">Active</strong></div>
          <div className="text-xs text-brand-gray">Zenodo DOI Gateway: <strong className="text-emerald-600">Active</strong></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-brand-light-gray shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-brand-black">Data Governance & Privacy</h2>
          <div className="text-xs text-brand-gray">Zero-Retention Policy: <strong className="text-emerald-600">Enforced</strong></div>
          <p className="text-xs text-brand-gray">Manuscript drafts are evaluated in isolated memory and never used for training public models.</p>
        </div>
      </div>
    </div>
  );
}
