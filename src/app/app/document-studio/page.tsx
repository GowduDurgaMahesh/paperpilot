'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/projectcontext';
import { generateManuscriptDocx } from '@/lib/docx-generator';
import { generateResearchReportPDF } from '@/lib/pdf-generator';
import {
  PenTool,
  Save,
  Download,
  FileText,
  Sparkles,
  Check,
  RotateCcw,
  BookOpen
} from 'lucide-react';

export default function DocumentStudioPage() {
  const { currentProject, updateCurrentProject, addAuditLog } = useProject();
  const [content, setContent] = useState(
    currentProject.fullText ||
      `# ${currentProject.title}\n\n## Abstract\n${currentProject.abstract}\n\n## 1. Introduction\nRecent advancements in high-throughput computation and algorithmic efficiency have highlighted the crucial role of structured model optimizations. In this paper, we explore dynamic inference under edge latency constraints.\n\n## 2. Methodology\nWe implemented a multi-stage ablation methodology evaluated against benchmark datasets.\n\n## 3. Results\nEmpirical evaluations indicate a 28% latency reduction while preserving 99.4% top-1 accuracy.`
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateCurrentProject({
      fullText: content,
      wordCount: content.split(/\s+/).filter(Boolean).length
    });
    addAuditLog('Edited Manuscript Content', 'edit', 'Document Studio changes committed.');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const words = content.split(/\s+/).filter(Boolean).length;
  const characters = content.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-black tracking-tight">Manuscript Document Studio</h1>
          <p className="text-sm text-brand-gray mt-1">
            Real-time academic authoring environment with integrated citation grounding and instant export.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-sm"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved' : 'Save Changes'}
          </button>
          <button
            onClick={() => generateManuscriptDocx(currentProject)}
            className="px-3.5 py-2 bg-white hover:bg-brand-off-white border border-brand-light-gray text-brand-dark rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            DOCX
          </button>
          <button
            onClick={() => generateResearchReportPDF(currentProject)}
            className="px-3.5 py-2 bg-white hover:bg-brand-off-white border border-brand-light-gray text-brand-dark rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            PDF Dossier
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="bg-white rounded-2xl border border-brand-light-gray shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {/* Editor Toolbar */}
        <div className="border-b border-brand-light-gray px-4 py-2.5 bg-brand-off-white/60 flex items-center justify-between text-xs text-brand-gray">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-brand-dark">Markdown Editor</span>
            <span>Words: <strong className="text-brand-black">{words.toLocaleString()}</strong></span>
            <span>Characters: <strong className="text-brand-black">{characters.toLocaleString()}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
              Pre-check Sync Active
            </span>
          </div>
        </div>

        {/* Text Area */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 w-full p-6 text-sm font-mono text-brand-black focus:outline-none resize-none leading-relaxed min-h-[500px]"
          placeholder="Start drafting or pasting your manuscript text here..."
        />
      </div>
    </div>
  );
}
