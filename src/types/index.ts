export interface ResearchProject {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  field: string;
  targetJournal: string;
  status: 'draft' | 'analyzing' | 'ready' | 'submitted';
  readinessScore: number;
  wordCount: number;
  citationCount: number;
  createdAt: string;
  updatedAt: string;
  fullText?: string;
  sections?: {
    title: string;
    content: string;
  }[];
}

export interface QualityMetric {
  category: string;
  score: number;
  weight: number;
  status: 'passed' | 'warning' | 'critical';
  findings: string[];
  recommendations: string[];
}

export interface JournalMatch {
  name: string;
  publisher: string;
  impactFactor: number;
  matchScore: number;
  acceptanceRate: string;
  avgReviewTime: string;
  openAccess: boolean;
  aimsMatch: string;
  requirements: {
    maxWords: number;
    citationStyle: string;
    abstractLimit: number;
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  category: 'edit' | 'analysis' | 'export' | 'compliance' | 'security';
}

export interface CitationItem {
  id: string;
  authors: string;
  title: string;
  journal: string;
  year: number;
  doi: string;
  verified: boolean;
  citationStyle: 'APA' | 'IEEE' | 'Nature' | 'Chicago' | 'MLA';
  contextSnippet: string;
}

export interface ResearchGap {
  id: string;
  title: string;
  description: string;
  impactPotential: 'High' | 'Medium' | 'Low';
  suggestedMethodology: string;
  relatedLiterature: string[];
}
