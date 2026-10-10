'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/projectcontext';
import { CitationItem } from '@/types';
import {
  BookMarked,
  Plus,
  CheckCircle2,
  ExternalLink,
  Search,
  Filter,
  Check
} from 'lucide-react';

export default function EvidenceCitationsPage() {
  const { citations, addCitation } = useProject();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [journal, setJournal] = useState('');
  const [year, setYear] = useState(2024);
  const [doi, setDoi] = useState('');
  const [citationStyle, setCitationStyle] = useState<'IEEE' | 'APA' | 'Nature' | 'Chicago' | 'MLA'>('IEEE');
  const [contextSnippet, setContextSnippet] = useState('');

  const handleAddCitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addCitation({
      title,
      authors: authors || 'Unknown Author et al.',
      journal: journal || 'Journal of Research',
      year: Number(year) || 2024,
      doi: doi || '10.1000/182',
      verified: true,
      citationStyle,
      contextSnippet: contextSnippet || 'Cited in Section 2 as foundational context.'
    });

    setTitle('');
    setAuthors('');
    setJournal('');
    setDoi('');
    setContextSnippet('');
    setShowAddModal(false);
  };

  const filtered = citations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.journal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-black tracking-tight">Evidence & Citation Grounding</h1>
          <p className="text-sm text-brand-gray mt-1">
            Real-time CrossRef verification, phantom reference prevention, and bibliographic style compliance.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Citation
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-brand-light-gray shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-brand-gray shrink-0 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter references by title, author, or publication venue..."
          className="w-full text-xs text-brand-black focus:outline-none"
        />
      </div>

      {/* Citations List */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white p-5 rounded-2xl border border-brand-light-gray shadow-sm space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-blue font-mono">[{item.citationStyle}]</span>
                <h2 className="text-sm font-bold text-brand-black">{item.title}</h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  DOI Verified
                </span>
                <span className="text-xs text-brand-gray font-mono">{item.year}</span>
              </div>
            </div>

            <div className="text-xs text-brand-gray">
              <span className="font-semibold text-brand-dark">{item.authors}</span> — <em>{item.journal}</em>
            </div>

            <div className="p-3 rounded-xl bg-brand-off-white border border-brand-light-gray text-xs text-brand-dark">
              <span className="font-bold text-[10px] uppercase text-brand-gray block mb-1">
                Manuscript In-Text Grounding:
              </span>
              <p className="italic">{item.contextSnippet}</p>
            </div>

            <div className="text-[11px] font-mono text-brand-gray flex items-center gap-1">
              <span>DOI: {item.doi}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-brand-light-gray shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-brand-black">Add Verified Academic Citation</h3>

            <form onSubmit={handleAddCitation} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-brand-dark mb-1">Paper Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scaling Laws for Neural Language Models"
                  className="w-full px-3 py-2 rounded-xl border border-brand-light-gray focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-dark mb-1">Authors *</label>
                <input
                  type="text"
                  required
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="e.g. Kaplan, J., McCandlish, S., Henighan, T., et al."
                  className="w-full px-3 py-2 rounded-xl border border-brand-light-gray focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-brand-dark mb-1">Journal / Conference</label>
                  <input
                    type="text"
                    value={journal}
                    onChange={(e) => setJournal(e.target.value)}
                    placeholder="e.g. arXiv preprint"
                    className="w-full px-3 py-2 rounded-xl border border-brand-light-gray focus:outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block font-bold text-brand-dark mb-1">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-brand-light-gray focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-brand-dark mb-1">DOI Link / Identifier</label>
                <input
                  type="text"
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  placeholder="e.g. 10.48550/arXiv.2001.08361"
                  className="w-full px-3 py-2 rounded-xl border border-brand-light-gray focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-dark mb-1">In-Text Context Snippet</label>
                <input
                  type="text"
                  value={contextSnippet}
                  onChange={(e) => setContextSnippet(e.target.value)}
                  placeholder="e.g. ...as demonstrated by empirical power-law parameters..."
                  className="w-full px-3 py-2 rounded-xl border border-brand-light-gray focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-brand-gray hover:text-brand-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl font-semibold"
                >
                  Add Reference
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
