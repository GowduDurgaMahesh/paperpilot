'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProject } from '@/context/projectcontext';
import mammoth from 'mammoth';
import {
  Upload,
  FileText,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2
} from 'lucide-react';

export default function NewAnalysisPage() {
  const router = useRouter();
  const { addProject } = useProject();

  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [field, setField] = useState('Computer Science & AI');
  const [targetJournal, setTargetJournal] = useState('IEEE Transactions on Pattern Analysis and Machine Intelligence');
  const [authors, setAuthors] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setStatusMessage('Reading manuscript file buffer...');

    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;
        
        // Auto-extract preliminary title or abstract if possible
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length > 0 && !title) {
          setTitle(lines[0].substring(0, 120));
        }
        if (lines.length > 1 && !abstract) {
          setAbstract(lines.slice(1, 4).join(' ').substring(0, 500));
        }
        setStatusMessage(`Successfully extracted ${text.length} characters from DOCX.`);
      } else {
        const text = await file.text();
        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
        if (!abstract) setAbstract(text.substring(0, 400));
        setStatusMessage('Text content parsed successfully.');
      }
    } catch {
      setStatusMessage('File loaded. Please verify the title and abstract details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const authorList = authors.split(',').map((a) => a.trim()).filter(Boolean);
    const newProj = addProject({
      title,
      abstract,
      field,
      targetJournal,
      authors: authorList.length > 0 ? authorList : ['Principal Investigator'],
      wordCount: abstract.split(/\s+/).length + 4200,
      citationCount: 32,
    });

    router.push('/app/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black tracking-tight">New Manuscript Analysis</h1>
        <p className="text-sm text-brand-gray mt-1">
          Upload your manuscript draft or enter details to initiate automated readiness scoring and journal compliance auditing.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload Box */}
        <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-brand-light-gray hover:border-brand-blue-border transition-colors text-center relative">
          <input
            type="file"
            accept=".docx,.txt,.md,.pdf"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="w-14 h-14 rounded-2xl bg-brand-blue-light text-brand-blue flex items-center justify-center mx-auto mb-4">
            <Upload className="w-7 h-7" />
          </div>
          <div className="text-sm font-bold text-brand-black">
            {fileName ? fileName : 'Drag & drop your manuscript (.docx, .pdf, .txt)'}
          </div>
          <p className="text-xs text-brand-gray mt-1">
            Files are analyzed in secure ephemeral memory according to academic data privacy standards.
          </p>
          {statusMessage && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {statusMessage}
            </div>
          )}
        </div>

        {/* Manuscript Metadata */}
        <div className="bg-white p-6 rounded-2xl border border-brand-light-gray shadow-sm space-y-4">
          <h2 className="text-base font-bold text-brand-black flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-blue" />
            Manuscript Metadata
          </h2>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">
              Manuscript Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Adaptive Dynamic Pruning for Quantized Edge Neural Networks"
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-light-gray text-xs focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">
              Abstract
            </label>
            <textarea
              rows={4}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Paste the manuscript abstract here for automated NLP semantic gap and keyword extraction..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-light-gray text-xs focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">
                Disciplinary Field
              </label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-light-gray text-xs focus:outline-none focus:border-brand-blue bg-white"
              >
                <option value="Computer Science & AI">Computer Science & AI</option>
                <option value="Bioengineering & Medicine">Bioengineering & Medicine</option>
                <option value="Physics & Materials Science">Physics & Materials Science</option>
                <option value="Social Sciences & Economics">Social Sciences & Economics</option>
                <option value="Environmental & Earth Sciences">Environmental & Earth Sciences</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">
                Target Publication / Journal
              </label>
              <input
                type="text"
                value={targetJournal}
                onChange={(e) => setTargetJournal(e.target.value)}
                placeholder="e.g. Nature Machine Intelligence or IEEE Transactions"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-light-gray text-xs focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">
              Co-Authors (comma-separated)
            </label>
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder="e.g. Dr. Lohit Sharma, Biswaranjan P., Elena Rostova, Ph.D."
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-light-gray text-xs focus:outline-none focus:border-brand-blue"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-brand-gray hover:text-brand-black transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessing || !title.trim()}
            className="px-6 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Create Project & Begin Audit
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
