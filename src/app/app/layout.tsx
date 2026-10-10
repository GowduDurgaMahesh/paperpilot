'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProject } from '@/context/projectcontext';
import {
  LayoutDashboard,
  FilePlus2,
  FileSearch,
  PenTool,
  CheckCircle2,
  Award,
  ShieldAlert,
  Search,
  BookMarked,
  Share2,
  Users2,
  History,
  Settings,
  HelpCircle,
  FileText,
  Sliders,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  Dna,
  PackageCheck
} from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { projects, currentProject, setCurrentProject } = useProject();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

  const navSections = [
    {
      label: 'Core Workspace',
      items: [
        { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/app/new-analysis', label: 'New Analysis', icon: FilePlus2 },
        { href: '/app/document-analysis', label: 'Document Analysis', icon: FileSearch },
        { href: '/app/document-studio', label: 'Document Studio', icon: PenTool },
      ]
    },
    {
      label: 'Evaluation & Pre-Review',
      items: [
        { href: '/app/quality-analyzer', label: 'Quality Analyzer', icon: CheckCircle2 },
        { href: '/app/readiness-report', label: 'Readiness Report', icon: Award },
        { href: '/app/pre-review', label: 'Pre-Review Engine', icon: ShieldAlert },
        { href: '/app/research-gap', label: 'Research Gap Explorer', icon: Sparkles },
        { href: '/app/research-dna', label: 'Research DNA', icon: Dna },
        { href: '/app/evidence-citations', label: 'Evidence & Citations', icon: BookMarked },
      ]
    },
    {
      label: 'Journal & Submission',
      items: [
        { href: '/app/journal-finder', label: 'Journal Finder', icon: Search },
        { href: '/app/journal-compliance', label: 'Compliance Rules', icon: CheckCircle2 },
        { href: '/app/journal-formatting', label: 'Journal Formatting', icon: Sliders },
        { href: '/app/submission-package', label: 'Submission Package', icon: PackageCheck },
      ]
    },
    {
      label: 'Collaboration & Tools',
      items: [
        { href: '/app/collaboration', label: 'Collaboration Board', icon: Share2 },
        { href: '/app/communities', label: 'Research Communities', icon: Users2 },
        { href: '/app/interview', label: 'Author Defense Mock', icon: HelpCircle },
        { href: '/app/reports', label: 'Reports Hub', icon: FileText },
        { href: '/app/audit-trail', label: 'Audit Trail', icon: History },
        { href: '/app/settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-brand-off-white flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-brand-light-gray px-4 py-3 sticky top-0 z-40">
        <Link href="/app/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center text-white font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <span className="font-bold text-brand-black text-lg">PaperPilot</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-brand-gray hover:text-brand-black"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-white border-r border-brand-light-gray flex flex-col shrink-0 sticky top-0 md:h-screen z-30 overflow-y-auto`}
      >
        {/* Brand */}
        <div className="p-4 border-b border-brand-light-gray hidden md:flex items-center justify-between">
          <Link href="/app/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-sm font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-brand-black text-lg leading-none">PaperPilot</span>
              <div className="text-[10px] font-semibold text-brand-blue uppercase tracking-wider mt-0.5">Academic OS</div>
            </div>
          </Link>
        </div>

        {/* Project Selector */}
        <div className="p-3 border-b border-brand-light-gray">
          <div className="relative">
            <button
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="w-full text-left p-2.5 rounded-xl bg-brand-off-white hover:bg-brand-light-gray/60 border border-brand-light-gray transition-colors flex items-center justify-between"
            >
              <div className="min-w-0 pr-2">
                <div className="text-[10px] uppercase font-bold text-brand-gray tracking-wider">Active Manuscript</div>
                <div className="text-xs font-semibold text-brand-black truncate">
                  {currentProject.title}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-brand-gray shrink-0" />
            </button>

            {projectDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-brand-light-gray rounded-xl shadow-lg z-50 p-1.5 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-brand-gray uppercase">Switch Project</div>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentProject(p);
                      setProjectDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      p.id === currentProject.id
                        ? 'bg-brand-blue-light text-brand-blue font-semibold'
                        : 'hover:bg-brand-off-white text-brand-dark'
                    }`}
                  >
                    <span className="truncate pr-2">{p.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-mono border">
                      {p.readinessScore}%
                    </span>
                  </button>
                ))}
                <div className="pt-1 border-t border-brand-light-gray">
                  <Link
                    href="/app/new-analysis"
                    onClick={() => setProjectDropdownOpen(false)}
                    className="w-full block text-center px-2 py-1.5 text-xs text-brand-blue font-semibold hover:bg-brand-blue-light rounded-lg transition-colors"
                  >
                    + Create New Project
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 p-3 space-y-6">
          {navSections.map((sec, idx) => (
            <div key={idx}>
              <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-gray">
                {sec.label}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-brand-blue text-white shadow-sm font-semibold'
                          : 'text-brand-dark hover:bg-brand-off-white hover:text-brand-black'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-brand-gray'}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-brand-light-gray bg-white">
          <div className="flex items-center justify-between p-2 rounded-xl bg-brand-off-white border border-brand-light-gray">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-blue text-white flex items-center justify-center text-xs font-bold">
                BP
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-brand-black truncate">Biswaranjan P.</div>
                <div className="text-[10px] text-brand-gray truncate">Senior Researcher</div>
              </div>
            </div>
            <Link href="/" className="text-[10px] font-semibold text-brand-blue hover:underline">
              Exit
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-14 border-b border-brand-light-gray bg-white/90 backdrop-blur px-6 hidden md:flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-semibold text-brand-gray">Manuscript:</span>
            <span className="text-xs font-bold text-brand-black truncate max-w-md">
              {currentProject.title}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              currentProject.status === 'ready'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {currentProject.status.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 font-medium text-brand-gray">
              <span>Readiness Score:</span>
              <span className="font-bold text-brand-blue text-sm">{currentProject.readinessScore}%</span>
            </div>
            <Link
              href="/app/submission-package"
              className="px-3 py-1.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-lg font-medium transition-colors shadow-sm flex items-center gap-1.5"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              Package Submission
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
