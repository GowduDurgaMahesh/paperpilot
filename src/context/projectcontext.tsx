'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ResearchProject, QualityMetric, CitationItem, AuditLog, ResearchGap } from '@/types';

interface ProjectContextType {
  projects: ResearchProject[];
  currentProject: ResearchProject;
  setCurrentProject: (project: ResearchProject) => void;
  updateCurrentProject: (updates: Partial<ResearchProject>) => void;
  addProject: (project: Partial<ResearchProject>) => ResearchProject;
  citations: CitationItem[];
  addCitation: (citation: Omit<CitationItem, 'id'>) => void;
  auditLogs: AuditLog[];
  addAuditLog: (action: string, category: AuditLog['category'], details: string) => void;
  qualityMetrics: QualityMetric[];
  researchGaps: ResearchGap[];
  isAnalyzing: boolean;
  runAnalysis: () => Promise<void>;
}

const defaultProjects: ResearchProject[] = [
  {
    id: 'proj-1',
    title: 'Transformer Attention Mechanisms in Distributed Edge Latency Optimization',
    abstract: 'Edge-native deep learning pipelines suffer from significant bandwidth and computational bottlenecks during multi-modal inference. This paper proposes a sparse recurrent attention pruning mechanism tailored for quantized tensor operations on micro-accelerators.',
    authors: ['Dr. Lohit Sharma', 'Biswaranjan P.', 'Elena Rostova, Ph.D.'],
    field: 'Computer Science & AI',
    targetJournal: 'IEEE Transactions on Neural Networks & Learning Systems',
    status: 'ready',
    readinessScore: 92,
    wordCount: 7850,
    citationCount: 46,
    createdAt: '2026-09-14T10:00:00Z',
    updatedAt: '2026-10-09T18:30:00Z',
    fullText: 'Edge-native deep learning pipelines suffer from significant bandwidth and computational bottlenecks during multi-modal inference...'
  },
  {
    id: 'proj-2',
    title: 'Biomarker Synthesis and CRISPR Cas-13 Diagnostics in Microfluidic Chips',
    abstract: 'Point-of-care viral detection requires high-fidelity enzymatic amplification without thermal cycling dependencies. Here, we present an integrated isothermal Cas-13 assay embedded within cyclic olefin copolymer microchannels.',
    authors: ['Biswaranjan P.', 'Sarah Chen, M.D.'],
    field: 'Bioengineering & Biomedical Sciences',
    targetJournal: 'Nature Biomedical Engineering',
    status: 'analyzing',
    readinessScore: 78,
    wordCount: 6240,
    citationCount: 38,
    createdAt: '2026-10-02T08:15:00Z',
    updatedAt: '2026-10-08T12:00:00Z',
    fullText: 'Point-of-care viral detection requires high-fidelity enzymatic amplification without thermal cycling dependencies...'
  }
];

const defaultQualityMetrics: QualityMetric[] = [
  {
    category: 'Methodology & Experimental Rigor',
    score: 95,
    weight: 0.3,
    status: 'passed',
    findings: [
      'Statistically robust ablation study with p < 0.001 significance validation',
      'Dual baseline comparisons executed across 4 public test benches'
    ],
    recommendations: [
      'Document hardware spec sheet in Section 3.2 for replication precision'
    ]
  },
  {
    category: 'Literature Grounding & Citation Quality',
    score: 88,
    weight: 0.25,
    status: 'passed',
    findings: [
      '46 references verified across CrossRef and arXiv APIs',
      '82% of citations published within the last 36 months'
    ],
    recommendations: [
      'Add foundational paper from Vaswani et al. (2017) to Section 2'
    ]
  },
  {
    category: 'Structure & Journal Style Compliance',
    score: 94,
    weight: 0.2,
    status: 'passed',
    findings: [
      'Adheres to IEEE two-column abstract length specifications (under 250 words)',
      'Equations formatted cleanly with standard mathematical notation'
    ],
    recommendations: [
      'Ensure high-resolution 300 DPI vectors for Figure 4 and Figure 7'
    ]
  },
  {
    category: 'Clarity & Scholarly Tone',
    score: 86,
    weight: 0.15,
    status: 'warning',
    findings: [
      'Overall passive voice ratio is 22%, optimal for empirical sciences',
      'Flesch-Kincaid Reading Grade Level: 15.4 (Academic Peer Review standard)'
    ],
    recommendations: [
      'Reduce redundant adverbials in the Introduction paragraphs 2 and 4'
    ]
  },
  {
    category: 'Reproducibility & Ethics Disclosures',
    score: 100,
    weight: 0.1,
    status: 'passed',
    findings: [
      'Open-source code repository and Zenodo DOI provided in data availability section',
      'Conflict of interest and funding source declarations are intact'
    ],
    recommendations: []
  }
];

const defaultCitations: CitationItem[] = [
  {
    id: 'cit-1',
    authors: 'Vaswani, A., Shazeer, N., Parmar, N., et al.',
    title: 'Attention is All You Need',
    journal: 'Advances in Neural Information Processing Systems (NeurIPS)',
    year: 2017,
    doi: '10.5555/3295222.3295349',
    verified: true,
    citationStyle: 'IEEE',
    contextSnippet: '...standard self-attention mechanisms operate with quadratic complexity O(n^2)...'
  },
  {
    id: 'cit-2',
    authors: 'Touvrone, H., Martin, L., Stone, K., et al.',
    title: 'Llama 2: Open Foundation and Fine-Tuned Chat Models',
    journal: 'arXiv preprint',
    year: 2023,
    doi: '10.48550/arXiv.2307.09288',
    verified: true,
    citationStyle: 'IEEE',
    contextSnippet: '...recent autoregressive parameter architectures require distributed tensor sharding...'
  },
  {
    id: 'cit-3',
    authors: 'Devlin, J., Chang, M. W., Lee, K., Toutanova, K.',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    journal: 'NAACL-HLT',
    year: 2019,
    doi: '10.18653/v1/N19-1423',
    verified: true,
    citationStyle: 'IEEE',
    contextSnippet: '...bidirectional masking enforces contextual representations without auto-regressive drift...'
  }
];

const defaultAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-10-09 18:30:12',
    action: 'Compliance Verification Passed',
    user: 'PaperPilot Pre-Check Engine',
    details: 'Verified IEEE formatting constraints and abstract word limits.',
    category: 'compliance'
  },
  {
    id: 'log-2',
    timestamp: '2026-10-09 16:45:00',
    action: 'Manuscript Analysis Completed',
    user: 'Biswaranjan P.',
    details: 'Readiness evaluation calculated at 92% composite score.',
    category: 'analysis'
  },
  {
    id: 'log-3',
    timestamp: '2026-10-09 14:10:22',
    action: 'Citation Verification',
    user: 'PaperPilot CrossRef Linker',
    details: '46/46 references successfully resolved with active DOI links.',
    category: 'edit'
  }
];

const defaultResearchGaps: ResearchGap[] = [
  {
    id: 'gap-1',
    title: 'Ultra-low Precision Quantization Fallback under Real-time Drift',
    description: 'Existing transformer optimizers lack dynamic recovery routines when int4 quantization precision drops below classification safety margins in autonomous edge nodes.',
    impactPotential: 'High',
    suggestedMethodology: 'Apply speculative dynamic calibration with residual error reservoirs.',
    relatedLiterature: ['Zhang et al. (2024)', 'Dettmers et al. (2023)']
  },
  {
    id: 'gap-2',
    title: 'Thermal Throttling Feedback into Dynamic Batch Window Size',
    description: 'Prior architectures measure only synthetic benchmark cycles rather than continuous physical junction temperature fluctuations.',
    impactPotential: 'Medium',
    suggestedMethodology: 'Embed hardware register polling in the scheduler dispatch queue.',
    relatedLiterature: ['Chen & Kumar (2025)']
  }
];

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<ResearchProject[]>(defaultProjects);
  const [currentProject, setCurrentProject] = useState<ResearchProject>(defaultProjects[0]);
  const [citations, setCitations] = useState<CitationItem[]>(defaultCitations);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(defaultAuditLogs);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>(defaultQualityMetrics);
  const [researchGaps] = useState<ResearchGap[]>(defaultResearchGaps);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const updateCurrentProject = (updates: Partial<ResearchProject>) => {
    setCurrentProject((prev) => {
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      setProjects((list) => list.map((p) => (p.id === prev.id ? updated : p)));
      return updated;
    });
  };

  const addProject = (projectData: Partial<ResearchProject>): ResearchProject => {
    const newProj: ResearchProject = {
      id: `proj-${Date.now()}`,
      title: projectData.title || 'Untitled Manuscript',
      abstract: projectData.abstract || '',
      authors: projectData.authors || ['Lead Researcher'],
      field: projectData.field || 'Computer Science',
      targetJournal: projectData.targetJournal || 'IEEE Transactions',
      status: 'analyzing',
      readinessScore: 75,
      wordCount: projectData.wordCount || 4500,
      citationCount: projectData.citationCount || 24,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fullText: projectData.fullText || ''
    };
    setProjects((prev) => [newProj, ...prev]);
    setCurrentProject(newProj);
    addAuditLog('Created New Manuscript Project', 'edit', `Created: ${newProj.title}`);
    return newProj;
  };

  const addCitation = (item: Omit<CitationItem, 'id'>) => {
    const newCit: CitationItem = {
      id: `cit-${Date.now()}`,
      ...item
    };
    setCitations((prev) => [newCit, ...prev]);
    addAuditLog('Added Academic Citation', 'edit', `Added reference: ${item.title}`);
  };

  const addAuditLog = (action: string, category: AuditLog['category'], details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action,
      user: 'Current User',
      details,
      category
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    addAuditLog('Triggered Deep Quality Analysis', 'analysis', `Analysis initiated for ${currentProject.title}`);
    
    // Simulate multi-stage scientific evaluation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const newScore = Math.min(98, Math.max(82, currentProject.readinessScore + 4));
    updateCurrentProject({
      readinessScore: newScore,
      status: 'ready'
    });
    
    setIsAnalyzing(false);
    addAuditLog('Deep Quality Analysis Complete', 'analysis', `Score updated to ${newScore}%`);
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProject,
        updateCurrentProject,
        addProject,
        citations,
        addCitation,
        auditLogs,
        addAuditLog,
        qualityMetrics,
        researchGaps,
        isAnalyzing,
        runAnalysis
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
