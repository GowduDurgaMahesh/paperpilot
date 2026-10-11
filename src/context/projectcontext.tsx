
'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ResearchProject,
  QualityMetric,
  CitationItem,
  AuditLog,
  ResearchGap,
} from '@/types';

import { createClient } from '@/lib/supabase/client';

interface ProjectContextType {
  projects: ResearchProject[];
  currentProject: ResearchProject;
  setCurrentProject: (project: ResearchProject) => void;
  updateCurrentProject: (updates: Partial<ResearchProject>) => void;
  addProject: (project: Partial<ResearchProject>) => ResearchProject;
  citations: CitationItem[];
  addCitation: (citation: Omit<CitationItem, 'id'>) => void;
  auditLogs: AuditLog[];
  addAuditLog: (
    action: string,
    category: AuditLog['category'],
    details: string
  ) => void;
  qualityMetrics: QualityMetric[];
  researchGaps: ResearchGap[];
  isAnalyzing: boolean;
  runAnalysis: () => Promise<void>;
}

type DbProject = {
  id: string;
  user_id: string;
  title: string;
  abstract: string | null;
  authors: string[] | null;
  field: string | null;
  target_journal: string | null;
  status: ResearchProject['status'];
  readiness_score: number | null;
  word_count: number | null;
  citation_count: number | null;
  created_at: string;
  updated_at: string;
  full_text: string | null;
  sections: ResearchProject['sections'] | null;
};

const EMPTY_PROJECT: ResearchProject = {
  id: '',
  title: '',
  abstract: '',
  authors: [],
  field: 'Computer Science & AI',
  targetJournal: 'IEEE Transactions',
  status: 'draft',
  readinessScore: 0,
  wordCount: 0,
  citationCount: 0,
  createdAt: '',
  updatedAt: '',
  fullText: '',
  sections: [],
};

const ProjectContext = createContext<ProjectContextType | undefined>(
  undefined
);

function mapProject(row: DbProject): ResearchProject {
  return {
    id: row.id,
    title: row.title,
    abstract: row.abstract ?? '',
    authors: row.authors ?? [],
    field: row.field ?? 'Computer Science & AI',
    targetJournal: row.target_journal ?? 'IEEE Transactions',
    status: row.status,
    readinessScore: row.readiness_score ?? 0,
    wordCount: row.word_count ?? 0,
    citationCount: row.citation_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    fullText: row.full_text ?? '',
    sections: row.sections ?? [],
  };
}

function mapCitation(row: Record<string, unknown>): CitationItem {
  return {
    id: String(row.id),
    authors: String(row.authors ?? ''),
    title: String(row.title ?? ''),
    journal: String(row.journal ?? ''),
    year: typeof row.year === 'number' ? row.year : 0,
    doi: String(row.doi ?? ''),
    verified: Boolean(row.verified),
    citationStyle: (
      row.citation_style ?? 'IEEE'
    ) as CitationItem['citationStyle'],
    contextSnippet: String(row.context_snippet ?? ''),
  };
}

function mapQualityMetric(
  row: Record<string, unknown>
): QualityMetric {
  return {
    category: String(row.category ?? ''),
    score: Number(row.score ?? 0),
    weight: Number(row.weight ?? 0.2),
    status: row.status as QualityMetric['status'],
    findings: Array.isArray(row.findings)
      ? row.findings.map(String)
      : [],
    recommendations: Array.isArray(row.recommendations)
      ? row.recommendations.map(String)
      : [],
  };
}

function mapResearchGap(row: Record<string, unknown>): ResearchGap {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    impactPotential: (
      row.impact_potential ?? 'Medium'
    ) as ResearchGap['impactPotential'],
    suggestedMethodology: String(row.suggested_methodology ?? ''),
    relatedLiterature: Array.isArray(row.related_literature)
      ? row.related_literature.map(String)
      : [],
  };
}

function mapAuditLog(row: Record<string, unknown>): AuditLog {
  const createdAt = String(row.created_at ?? new Date().toISOString());

  return {
    id: String(row.id),
    timestamp: createdAt.replace('T', ' ').substring(0, 19),
    action: String(row.action ?? ''),
    user: String(row.user_name ?? 'Current User'),
    details: String(row.details ?? ''),
    category: (row.category ?? 'edit') as AuditLog['category'],
  };
}

export function ProjectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);

  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [currentProject, setCurrentProjectState] =
    useState<ResearchProject>(EMPTY_PROJECT);

  const [citations, setCitations] = useState<CitationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>([]);
  const [researchGaps, setResearchGaps] = useState<ResearchGap[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('Current User');

  // Load the signed-in user's projects. RLS remains the database
  // security boundary; the user_id filter is an additional restriction.
  useEffect(() => {
    let active = true;

    async function loadProjects() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !user) {
        setUserId(null);
        setUserName('Current User');
        setProjects([]);
        setCurrentProjectState(EMPTY_PROJECT);
        setCitations([]);
        setAuditLogs([]);
        setQualityMetrics([]);
        setResearchGaps([]);
        return;
      }

      setUserId(user.id);

      const metadataName =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email?.split('@')[0];

      setUserName(
        typeof metadataName === 'string' && metadataName.trim()
          ? metadataName.trim()
          : 'Current User'
      );

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (!active) return;

      if (error) {
        console.error('Failed to load projects:', error.message);
        return;
      }

      const loadedProjects = ((data ?? []) as DbProject[]).map(mapProject);

      setProjects(loadedProjects);

      setCurrentProjectState((previous) => {
        if (previous.id) {
          const stillExists = loadedProjects.find(
            (project) => project.id === previous.id
          );

          if (stillExists) return stillExists;
        }

        return loadedProjects[0] ?? EMPTY_PROJECT;
      });
    }

    void loadProjects();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Defer the refresh so auth state changes can finish first.
      setTimeout(() => {
        if (active) void loadProjects();
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Load data belonging to the selected project only.
  useEffect(() => {
    let active = true;

    async function loadProjectData() {
      if (!userId || !currentProject.id) {
        setCitations([]);
        setAuditLogs([]);
        setQualityMetrics([]);
        setResearchGaps([]);
        return;
      }

      const projectId = currentProject.id;

      const [
        citationsResult,
        logsResult,
        metricsResult,
        gapsResult,
      ] = await Promise.all([
        supabase
          .from('citations')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),

        supabase
          .from('audit_logs')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(100),

        supabase
          .from('quality_metrics')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),

        supabase
          .from('research_gaps')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
      ]);

      if (!active) return;

      if (citationsResult.error) {
        console.error(
          'Failed to load citations:',
          citationsResult.error.message
        );
      } else {
        setCitations(
          (citationsResult.data ?? []).map((row) =>
            mapCitation(row as Record<string, unknown>)
          )
        );
      }

      if (logsResult.error) {
        console.error(
          'Failed to load audit logs:',
          logsResult.error.message
        );
      } else {
        setAuditLogs(
          (logsResult.data ?? []).map((row) =>
            mapAuditLog(row as Record<string, unknown>)
          )
        );
      }

      if (metricsResult.error) {
        console.error(
          'Failed to load quality metrics:',
          metricsResult.error.message
        );
      } else {
        setQualityMetrics(
          (metricsResult.data ?? []).map((row) =>
            mapQualityMetric(row as Record<string, unknown>)
          )
        );
      }

      if (gapsResult.error) {
        console.error(
          'Failed to load research gaps:',
          gapsResult.error.message
        );
      } else {
        setResearchGaps(
          (gapsResult.data ?? []).map((row) =>
            mapResearchGap(row as Record<string, unknown>)
          )
        );
      }
    }

    void loadProjectData();

    return () => {
      active = false;
    };
  }, [supabase, userId, currentProject.id]);

  const setCurrentProject = useCallback(
    (project: ResearchProject) => {
      // Ignore projects that aren't in this user's loaded project list.
      const ownedProject = projects.find((item) => item.id === project.id);

      if (ownedProject) {
        setCurrentProjectState(ownedProject);
      }
    },
    [projects]
  );

  const addAuditLog = useCallback(
    (
      action: string,
      category: AuditLog['category'],
      details: string
    ) => {
      if (!userId) {
        console.error('Cannot save an audit log without a signed-in user.');
        return;
      }

      const projectId = currentProject.id || null;

      if (projectId && !projects.some((project) => project.id === projectId)) {
        console.error('Cannot log activity for an unowned project.');
        return;
      }

      void (async () => {
        const { data, error } = await supabase
          .from('audit_logs')
          .insert({
            user_id: userId,
            project_id: projectId,
            action,
            category,
            details,
            user_name: userName,
          })
          .select('*')
          .single();

        if (error) {
          console.error('Failed to save audit log:', error.message);
          return;
        }

        if (projectId === currentProject.id && data) {
          setAuditLogs((previous) => [
            mapAuditLog(data as Record<string, unknown>),
            ...previous,
          ]);
        }
      })();
    },
    [supabase, userId, userName, currentProject.id, projects]
  );

  const updateCurrentProject = useCallback(
    (updates: Partial<ResearchProject>) => {
      const projectId = currentProject.id;

      if (!userId || !projectId) {
        console.error('Select or create a saved project before editing.');
        return;
      }

      if (!projects.some((project) => project.id === projectId)) {
        console.error('Cannot update a project that is not owned by this user.');
        return;
      }

      const databaseUpdates: Record<string, unknown> = {};

      if (updates.title !== undefined) databaseUpdates.title = updates.title;
      if (updates.abstract !== undefined) databaseUpdates.abstract = updates.abstract;
      if (updates.authors !== undefined) databaseUpdates.authors = updates.authors;
      if (updates.field !== undefined) databaseUpdates.field = updates.field;
      if (updates.targetJournal !== undefined) {
        databaseUpdates.target_journal = updates.targetJournal;
      }
      if (updates.status !== undefined) databaseUpdates.status = updates.status;
      if (updates.readinessScore !== undefined) {
        databaseUpdates.readiness_score = updates.readinessScore;
      }
      if (updates.wordCount !== undefined) databaseUpdates.word_count = updates.wordCount;
      if (updates.citationCount !== undefined) {
        databaseUpdates.citation_count = updates.citationCount;
      }
      if (updates.fullText !== undefined) databaseUpdates.full_text = updates.fullText;
      if (updates.sections !== undefined) databaseUpdates.sections = updates.sections;

      if (Object.keys(databaseUpdates).length === 0) return;

      databaseUpdates.updated_at = new Date().toISOString();

      const previousProject = currentProject;
      const optimisticProject = {
        ...previousProject,
        ...updates,
        updatedAt: String(databaseUpdates.updated_at),
      };

      setCurrentProjectState(optimisticProject);
      setProjects((previous) =>
        previous.map((project) =>
          project.id === projectId ? optimisticProject : project
        )
      );

      void (async () => {
        const { data, error } = await supabase
          .from('projects')
          .update(databaseUpdates)
          .eq('id', projectId)
          .eq('user_id', userId)
          .select('*')
          .maybeSingle();

        if (error || !data) {
          console.error(
            'Failed to save project changes:',
            error?.message ?? 'No project was updated.'
          );

          const { data: freshData, error: refreshError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', userId)
            .maybeSingle();

          if (refreshError || !freshData) return;

          const freshProject = mapProject(freshData as DbProject);

          setProjects((previous) =>
            previous.map((project) =>
              project.id === projectId ? freshProject : project
            )
          );

          setCurrentProjectState((previous) =>
            previous.id === projectId ? freshProject : previous
          );

          return;
        }

        const savedProject = mapProject(data as DbProject);

        setProjects((previous) =>
          previous.map((project) =>
            project.id === projectId ? savedProject : project
          )
        );

        setCurrentProjectState((previous) =>
          previous.id === projectId ? savedProject : previous
        );
      })();
    },
    [supabase, userId, currentProject, projects]
  );

  const addProject = useCallback(
    (projectData: Partial<ResearchProject>): ResearchProject => {
      const now = new Date().toISOString();

      // This temporary ID is replaced with the database UUID after insert.
      const temporaryId = `pending-${Date.now()}`;

      const newProject: ResearchProject = {
        ...EMPTY_PROJECT,
        ...projectData,
        id: temporaryId,
        title: projectData.title?.trim() || 'Untitled Manuscript',
        abstract: projectData.abstract ?? '',
        authors: projectData.authors ?? [],
        field: projectData.field ?? 'Computer Science & AI',
        targetJournal: projectData.targetJournal ?? 'IEEE Transactions',
        status: 'draft',
        readinessScore: projectData.readinessScore ?? 0,
        wordCount: projectData.wordCount ?? 0,
        citationCount: projectData.citationCount ?? 0,
        createdAt: now,
        updatedAt: now,
        fullText: projectData.fullText ?? '',
        sections: projectData.sections ?? [],
      };

      if (!userId) {
        console.error('Sign in before creating a project.');
        return newProject;
      }

      setProjects((previous) => [newProject, ...previous]);
      setCurrentProjectState(newProject);

      void (async () => {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: userId,
            title: newProject.title,
            abstract: newProject.abstract,
            authors: newProject.authors,
            field: newProject.field,
            target_journal: newProject.targetJournal,
            status: newProject.status,
            readiness_score: newProject.readinessScore,
            word_count: newProject.wordCount,
            citation_count: newProject.citationCount,
            full_text: newProject.fullText ?? '',
            sections: newProject.sections ?? [],
          })
          .select('*')
          .single();

        if (error || !data) {
          console.error(
            'Failed to create project:',
            error?.message ?? 'No project was returned.'
          );

          setProjects((previous) =>
            previous.filter((project) => project.id !== temporaryId)
          );

          setCurrentProjectState((previous) =>
            previous.id === temporaryId
              ? projects[0] ?? EMPTY_PROJECT
              : previous
          );

          return;
        }

        const savedProject = mapProject(data as DbProject);

        setProjects((previous) =>
          previous.map((project) =>
            project.id === temporaryId ? savedProject : project
          )
        );

        setCurrentProjectState((previous) =>
          previous.id === temporaryId ? savedProject : previous
        );

        addAuditLog(
          'Created New Manuscript Project',
          'edit',
          `Created: ${savedProject.title}`
        );
      })();

      return newProject;
    },
    [supabase, userId, projects, addAuditLog]
  );

  const addCitation = useCallback(
    (item: Omit<CitationItem, 'id'>) => {
      const projectId = currentProject.id;

      if (
        !userId ||
        !projectId ||
        !projects.some((project) => project.id === projectId)
      ) {
        console.error('Select a saved project before adding a citation.');
        return;
      }

      void (async () => {
        const { data, error } = await supabase
          .from('citations')
          .insert({
            project_id: projectId,
            authors: item.authors,
            title: item.title,
            journal: item.journal,
            year: item.year || null,
            doi: item.doi || null,
            verified: item.verified,
            citation_style: item.citationStyle,
            context_snippet: item.contextSnippet,
          })
          .select('*')
          .single();

        if (error || !data) {
          console.error(
            'Failed to save citation:',
            error?.message ?? 'No citation was returned.'
          );
          return;
        }

        setCitations((previous) => [
          mapCitation(data as Record<string, unknown>),
          ...previous,
        ]);

        addAuditLog(
          'Added Academic Citation',
          'edit',
          `Added reference: ${item.title}`
        );

        // Keep the displayed citation count aligned with the saved rows.
        const { count, error: countError } = await supabase
          .from('citations')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId);

        if (!countError && count !== null) {
          updateCurrentProject({ citationCount: count });
        }
      })();
    },
    [
      supabase,
      userId,
      currentProject.id,
      projects,
      addAuditLog,
      updateCurrentProject,
    ]
  );

  const runAnalysis = useCallback(async () => {
    if (!userId || !currentProject.id) {
      console.error('Save a project before requesting analysis.');
      return;
    }

    // No real analysis service is connected in this context yet.
    // Never fabricate a score or mark an unanalysed project as ready.
    setIsAnalyzing(true);

    try {
      addAuditLog(
        'Analysis Requested',
        'analysis',
        `Analysis was requested for "${currentProject.title}". No analysis engine is configured in this context, so no readiness score was changed.`
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [userId, currentProject, addAuditLog]);

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
        runAnalysis,
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
