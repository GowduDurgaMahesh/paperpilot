'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/projectcontext';
import {
  Sliders,
  Type,
  Layout,
  Columns,
  Check,
  Download,
  FileText
} from 'lucide-react';
import { generateManuscriptDocx } from '@/lib/docx-generator';

export default function JournalFormattingPage() {
  const { currentProject } = useProject();
  const [template, setTemplate] = useState('IEEE Transactions Two-Column');
  const [fontSize, setFontSize] = useState('10pt');
  const [fontFamily, setFontFamily] = useState('Times New Roman');
  const [lineSpacing, setLineSpacing] = useState('Single (1.0)');
  const [margin, setMargin] = useState('0.75 in (IEEE Standard)');

  const templates = [
    {
      name: 'IEEE Transactions Two-Column',
      font: 'Times New Roman 10pt',
      columns: 'Two Columns (3.5 in each)',
      spacing: 'Single Spaced'
    },
    {
      name: 'Nature Standard Format',
      font: 'Arial 10pt',
      columns: 'Single Column (Continuous)',
      spacing: 'Double Spaced (Review Phase)'
    },
    {
      name: 'ACM Standard Format (Primary)',
      font: 'Libertine 9pt',
      columns: 'Single / Two Column Hybrid',
      spacing: 'Single Spaced'
    },
    {
      name: 'APA 7th Edition Scholarly',
      font: 'Calibri 11pt',
      columns: 'Single Column',
      spacing: 'Double Spaced'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-black tracking-tight">Journal Style & Layout Formatting</h1>
          <p className="text-sm text-brand-gray mt-1">
            Automated typographic typesetting engine conforming to publisher LaTeX and Word stylesheets.
          </p>
        </div>

        <button
          onClick={() => generateManuscriptDocx(currentProject)}
          className="px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Formatted DOCX
        </button>
      </div>

      {/* Preset Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((tmpl) => (
          <div
            key={tmpl.name}
            onClick={() => setTemplate(tmpl.name)}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              template === tmpl.name
                ? 'bg-brand-blue-light/30 border-brand-blue ring-1 ring-brand-blue/30'
                : 'bg-white border-brand-light-gray hover:border-brand-gray'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-brand-black">{tmpl.name}</h2>
              {template === tmpl.name && (
                <span className="w-5 h-5 rounded-full bg-brand-blue text-white flex items-center justify-center text-xs">
                  ✓
                </span>
              )}
            </div>
            <div className="space-y-1 text-xs text-brand-gray">
              <div>Typographic Base: {tmpl.font}</div>
              <div>Columns: {tmpl.columns}</div>
              <div>Leading Spacing: {tmpl.spacing}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Fine-Tuning Controls */}
      <div className="bg-white p-6 rounded-2xl border border-brand-light-gray shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-brand-black flex items-center gap-2">
          <Sliders className="w-4 h-4 text-brand-blue" />
          Manual Parameter Fine-Tuning
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-brand-dark mb-1">Body Typeface</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-brand-light-gray bg-white"
            >
              <option value="Times New Roman">Times New Roman</option>
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Computer Modern">Computer Modern (LaTeX)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Font Size</label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-brand-light-gray bg-white"
            >
              <option value="9pt">9 pt (Condensed)</option>
              <option value="10pt">10 pt (Standard Journal)</option>
              <option value="11pt">11 pt</option>
              <option value="12pt">12 pt (Double-spaced Draft)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Margins</label>
            <select
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-brand-light-gray bg-white"
            >
              <option value="0.75 in (IEEE Standard)">0.75 in (IEEE Standard)</option>
              <option value="1.0 in (Standard)">1.0 in (APA / Standard)</option>
              <option value="0.5 in (Compact)">0.5 in (Compact)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
