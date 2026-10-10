'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/projectcontext';
import {
  Share2,
  Users,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  Plus
} from 'lucide-react';

export default function CollaborationPage() {
  const { currentProject } = useProject();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    {
      id: 'c1',
      author: 'Dr. Lohit Sharma',
      role: 'Principal Investigator',
      timestamp: 'Today at 10:15 AM',
      text: 'Verified Section 3 ablation tables. The statistical significance values look consistent with our GPU cluster logs.'
    },
    {
      id: 'c2',
      author: 'Elena Rostova, Ph.D.',
      role: 'Methodologist',
      timestamp: 'Yesterday at 4:30 PM',
      text: 'Double-checked the references in CrossRef. Added three recent 2024 citations for low-rank reservoir buffers.'
    }
  ]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setComments([
      ...comments,
      {
        id: `c-${Date.now()}`,
        author: 'Biswaranjan P.',
        role: 'Co-Author',
        timestamp: 'Just now',
        text: commentText
      }
    ]);
    setCommentText('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black tracking-tight">Author Collaboration Board</h1>
        <p className="text-sm text-brand-gray mt-1">
          Co-author review cycles, revision sign-offs, and manuscript discussions for {currentProject.title}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Co-Authors list */}
        <div className="bg-white p-6 rounded-2xl border border-brand-light-gray shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-brand-black flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-blue" />
            Co-Authors & Sign-Offs
          </h2>

          <div className="space-y-3">
            {currentProject.authors.map((author, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-brand-light-gray bg-brand-off-white/40 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-brand-black">{author}</div>
                  <div className="text-[10px] text-brand-gray">{idx === 0 ? 'Lead Corresponding Author' : 'Contributing Author'}</div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Signed Off
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Comments Thread */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-brand-light-gray shadow-sm flex flex-col justify-between space-y-4 min-h-[420px]">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-brand-black flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-blue" />
              Manuscript Discussion Stream
            </h2>

            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="p-4 rounded-xl border border-brand-light-gray bg-brand-off-white/30 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-brand-black">{c.author} <span className="text-[10px] font-normal text-brand-gray">({c.role})</span></span>
                    <span className="text-[10px] text-brand-gray">{c.timestamp}</span>
                  </div>
                  <p className="text-xs text-brand-dark leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handlePostComment} className="flex gap-2 pt-2 border-t border-brand-light-gray">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Leave a comment or review note for the research team..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-brand-light-gray text-xs focus:outline-none focus:border-brand-blue"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
