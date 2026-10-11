BEGIN;

-- PaperPilot schema hardening
-- Prerequisite: the six core tables from the baseline migration exist.
-- Apply to a disposable development database first.

-- 1. Normalize required text fields.
-- These checks reject blank values without rewriting existing data.

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_not_blank
  CHECK (email IS NULL OR length(trim(email)) > 0);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_full_name_not_blank
  CHECK (full_name IS NULL OR length(trim(full_name)) > 0);

ALTER TABLE public.projects
  ADD CONSTRAINT projects_title_not_blank
  CHECK (length(trim(title)) > 0);

ALTER TABLE public.citations
  ADD CONSTRAINT citations_title_not_blank
  CHECK (length(trim(title)) > 0);

ALTER TABLE public.citations
  ADD CONSTRAINT citations_year_valid
  CHECK (year IS NULL OR year BETWEEN 1000 AND 2100);

ALTER TABLE public.research_gaps
  ADD CONSTRAINT research_gaps_title_not_blank
  CHECK (length(trim(title)) > 0);

ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_action_not_blank
  CHECK (length(trim(action)) > 0);

ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_user_name_not_blank
  CHECK (length(trim(user_name)) > 0);

-- 2. Improve profile uniqueness.
-- This fails safely if duplicate non-null email values exist.
CREATE UNIQUE INDEX idx_profiles_email_unique
  ON public.profiles (lower(email))
  WHERE email IS NOT NULL;

-- 3. Add owner-scoped project listing support.
CREATE INDEX idx_projects_user_status_updated_at
  ON public.projects (user_id, status, updated_at DESC);

-- 4. Support citation verification and year-based lookup.
CREATE INDEX idx_citations_project_verified_year
  ON public.citations (project_id, verified, year DESC);

-- 5. Support audit history lookup.
CREATE INDEX idx_audit_logs_project_created_at
  ON public.audit_logs (project_id, created_at DESC);

CREATE INDEX idx_audit_logs_user_created_at
  ON public.audit_logs (user_id, created_at DESC);

-- 6. Ensure the timestamp trigger functions use a safe search path.
ALTER FUNCTION public.paperpilot_set_updated_at()
  SET search_path = '';

ALTER FUNCTION public.paperpilot_handle_new_user()
  SET search_path = '';

COMMIT;