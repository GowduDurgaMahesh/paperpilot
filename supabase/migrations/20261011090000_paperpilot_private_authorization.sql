BEGIN;

-- =========================================================
-- PaperPilot: private-project, owner-only authorization
-- Target: local/disposable development database first
-- =========================================================

-- 1. Enable RLS on all core tables.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Remove client table privileges before granting the minimum.
REVOKE ALL ON TABLE
  public.profiles,
  public.projects,
  public.citations,
  public.quality_metrics,
  public.research_gaps,
  public.audit_logs
FROM PUBLIC, anon, authenticated;

-- 3. Authenticated users may read and update their own profile.
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, UPDATE
ON TABLE public.profiles
TO authenticated;

-- 4. Authenticated users may CRUD their own projects and project data.
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE
  public.projects,
  public.citations,
  public.quality_metrics,
  public.research_gaps
TO authenticated;

-- Client can read audit events for their own projects only.
GRANT SELECT ON TABLE public.audit_logs TO authenticated;

-- No client INSERT/UPDATE/DELETE privileges on audit_logs.
-- Privileged server operations can use service_role server-side only.

-- 5. Remove existing policies on these tables.
-- This makes the resulting policy set deterministic.
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles',
        'projects',
        'citations',
        'quality_metrics',
        'research_gaps',
        'audit_logs'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON %I.%I',
      p.policyname, p.schemaname, p.tablename
    );
  END LOOP;
END $$;

-- 6. Profiles: each user sees and updates their own row.
CREATE POLICY profiles_select_own
ON public.profiles
FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_update_own
ON public.profiles
FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

-- No client INSERT policy: profile rows are created by the
-- trusted auth.users trigger in the existing schema migration.
-- No client DELETE policy.

-- 7. Projects: owner-only CRUD.
CREATE POLICY projects_select_own
ON public.projects
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY projects_insert_own
ON public.projects
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY projects_update_own
ON public.projects
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY projects_delete_own
ON public.projects
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- 8. Citations: access only through an owned project.
CREATE POLICY citations_select_owned_project
ON public.citations
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = citations.project_id
      AND p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY citations_insert_owned_project
ON public.citations
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = citations.project_id
      AND p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY citations_update_owned_project
ON public.citations
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = citations.project_id
      AND p.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = citations.project_id
      AND p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY citations_delete_owned_project
ON public.citations
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = citations.project_id
      AND p.user_id = (SELECT auth.uid())
  )
);

-- 9. Quality metrics: access only through an owned project.
CREATE POLICY quality_metrics_select_owned_project
ON public.quality_metrics
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = quality_metrics.project_id
      AND p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY quality_metrics_insert_owned_project
ON public.quality_metrics
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = quality_metrics.project_id
      AND p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY quality_metrics_update_owned_project
ON public.quality_metrics
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = quality_metrics.project_id
      AND p.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = quality_metrics.project_id
      AND p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY quality_metrics_delete_owned_project
ON public.quality_metrics
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = quality_metrics.project_id
      AND p.user_id = (SELECT auth.uid())
  )
);

-- 10. Research gaps: access only through an owned project.
CREATE POLICY research_gaps_select_owned_project
ON public.research_gaps
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = research_gaps.project_id
      AND p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY research_gaps_insert_owned_project
ON public.research_gaps
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = research_gaps.project_id
      AND p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY research_gaps_update_owned_project
ON public.research_gaps
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = research_gaps.project_id
      AND p.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = research_gaps.project_id
      AND p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY research_gaps_delete_owned_project
ON public.research_gaps
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = research_gaps.project_id
      AND p.user_id = (SELECT auth.uid())
  )
);

-- 11. Audit logs are read-only for clients.
-- Rows without a project_id are not exposed to clients.
CREATE POLICY audit_logs_select_owned_project
ON public.audit_logs
FOR SELECT TO authenticated
USING (
  project_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = audit_logs.project_id
      AND p.user_id = (SELECT auth.uid())
  )
);

-- 12. Fail the transaction if any of the six tables lacks RLS.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles',
    'projects',
    'citations',
    'quality_metrics',
    'research_gaps',
    'audit_logs'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = t
        AND c.relrowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS verification failed for public.%', t;
    END IF;
  END LOOP;

  IF (
    SELECT count(*)
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles',
        'projects',
        'citations',
        'quality_metrics',
        'research_gaps',
        'audit_logs'
      )
  ) <> 19 THEN
    RAISE EXCEPTION 'Expected 19 PaperPilot policies on the six core tables.';
  END IF;
END $$;

COMMIT;