'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/projectcontext';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function AuditTrailPage() {
  const { auditLogs } = useProject();
  const [filterCat, setFilterCat] = useState<string>('all');
  const [query, setQuery] = useState('');

  const filtered = auditLogs.filter((log) => {
    const matchesCat = filterCat === 'all' || log.category === filterCat;
    const matchesQuery =
      log.action.toLowerCase().includes(query.toLowerCase()) ||
      log.details.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black tracking-tight">Academic Integrity & Audit Trail</h1>
        <p className="text-sm text-brand-gray mt-1">
          Cryptographically immutable provenance log tracking all manuscript evaluations, edits, and export operations.
        </p>
      </div>

      {/* Filter Header */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 bg-white p-2.5 rounded-xl border border-brand-light-gray flex items-center gap-2">
          <Search className="w-4 h-4 text-brand-gray ml-1" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search audit trail records..."
            className="w-full text-xs text-brand-black focus:outline-none"
          />
        </div>

        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="bg-white px-3 py-2 rounded-xl border border-brand-light-gray text-xs font-semibold text-brand-dark focus:outline-none"
        >
          <option value="all">All Categories</option>
          <option value="analysis">Analysis & Readiness</option>
          <option value="compliance">Compliance & Rules</option>
          <option value="edit">Edits & Additions</option>
          <option value="export">Export & Packaging</option>
        </select>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white rounded-2xl border border-brand-light-gray shadow-sm overflow-hidden">
        <div className="divide-y divide-brand-light-gray">
          {filtered.map((log) => (
            <div key={log.id} className="p-4 hover:bg-brand-off-white/40 transition-colors space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-brand-black">{log.action}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-off-white border border-brand-light-gray uppercase">
                    {log.category}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-brand-gray">{log.timestamp}</span>
              </div>
              <p className="text-xs text-brand-gray leading-relaxed">{log.details}</p>
              <div className="text-[10px] text-brand-dark font-medium">Actor: {log.user}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
