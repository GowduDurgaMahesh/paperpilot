-- ==============================================================================
-- Migration: 20261010000000_paperpilot_schema.sql
-- Project: PaperPilot AI (Lohit-CSM/paperpilot)
-- Phase: 2.7 - Collision-Safe & Verified Schema Migration
--
-- DESIGN & SAFETY SPECIFICATIONS:
--   1. Clean-Database Assumption: Strict CREATE TABLE statements are used without
--      permissive IF NOT EXISTS clauses, ensuring pre-existing schema conflicts
--      fail immediately and visibly rather than creating undetected partial state.
--   2. Project-Specific Function Namespace: Functions use dedicated identifiers
--      (public.paperpilot_set_updated_at, public.paperpilot_handle_new_user)
--      and undergo preflight catalog collision checks to prevent silent overwrites.
--   3. Trigger Identity Verification: The trigger on auth.users checks catalog
--      identity (schema, function name) to prevent silent skip or conflicting attachment.
--   4. Least-Privilege Protection: Trigger functions are explicitly revoked from
--      PUBLIC, and conditionally from anon/authenticated roles if present,
--      blocking PostgREST RPC exposure without breaking standalone PostgreSQL instances.
--   5. Default-Deny RLS: RLS is activated across all six public tables without
--      premature permissive policies (deferred to Phase 3).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Preflight Function Collision Checks
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'paperpilot_set_updated_at'
    ) THEN
        RAISE EXCEPTION 'Schema collision detected: public.paperpilot_set_updated_at() already exists in target database. Inspect or remove the conflicting function before applying migration.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'paperpilot_handle_new_user'
    ) THEN
        RAISE EXCEPTION 'Schema collision detected: public.paperpilot_handle_new_user() already exists in target database. Inspect or remove the conflicting function before applying migration.';
    END IF;
END
$$;

-- ------------------------------------------------------------------------------
-- 2. Helper Functions & Permissions
-- ------------------------------------------------------------------------------

-- Generic updated_at timestamp refresher (for table triggers)
CREATE OR REPLACE FUNCTION public.paperpilot_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Secure profile provisioner upon user creation in auth.users
CREATE OR REPLACE FUNCTION public.paperpilot_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_full_name TEXT;
BEGIN
    -- Safely extract and sanitize full_name from metadata using standard SQL constructs
    user_full_name := NULLIF(
        TRIM(
            COALESCE(
                new.raw_user_meta_data->>'full_name',
                new.raw_user_meta_data->>'name',
                ''
            )
        ),
        ''
    );

    -- Fallback to sanitized email handle if metadata name is absent
    IF user_full_name IS NULL AND new.email IS NOT NULL THEN
        user_full_name := NULLIF(
            TRIM(split_part(new.email, '@', 1)),
            ''
        );
    END IF;

    -- Final fallback if email is also absent or blank
    IF user_full_name IS NULL THEN
        user_full_name := 'Researcher';
    END IF;

    -- Insert profile row without trusting user metadata for privileged attributes
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        institution,
        default_citation_style,
        disciplines
    )
    VALUES (
        new.id,
        new.email,
        user_full_name,
        NULL,
        'IEEE',
        ARRAY['Computer Science & AI']::TEXT[]
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Revoke execute privileges from untrusted roles to prevent direct PostgREST RPC invocation.
-- Trigger functions are invoked by the PostgreSQL engine upon DML, not client RPC calls.
REVOKE ALL ON FUNCTION public.paperpilot_set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.paperpilot_handle_new_user() FROM PUBLIC;

-- Conditionally revoke from anon and authenticated if roles exist in the target database
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON FUNCTION public.paperpilot_set_updated_at() FROM anon;
        REVOKE ALL ON FUNCTION public.paperpilot_handle_new_user() FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON FUNCTION public.paperpilot_set_updated_at() FROM authenticated;
        REVOKE ALL ON FUNCTION public.paperpilot_handle_new_user() FROM authenticated;
    END IF;
END
$$;

-- ------------------------------------------------------------------------------
-- 3. Core Tables
-- ------------------------------------------------------------------------------

-- Table: public.profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    institution TEXT,
    default_citation_style TEXT NOT NULL DEFAULT 'IEEE'
        CHECK (default_citation_style IN ('APA', 'IEEE', 'Nature', 'Chicago', 'MLA')),
    disciplines TEXT[] NOT NULL DEFAULT ARRAY['Computer Science & AI']::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: public.projects (Manuscripts)
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    abstract TEXT NOT NULL DEFAULT '',
    authors TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    field TEXT NOT NULL DEFAULT 'Computer Science & AI',
    target_journal TEXT NOT NULL DEFAULT 'IEEE Transactions',
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'analyzing', 'ready', 'submitted')),
    readiness_score INTEGER NOT NULL DEFAULT 0
        CHECK (readiness_score >= 0 AND readiness_score <= 100),
    word_count INTEGER NOT NULL DEFAULT 0
        CHECK (word_count >= 0),
    citation_count INTEGER NOT NULL DEFAULT 0
        CHECK (citation_count >= 0),
    full_text TEXT,
    sections JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: public.citations
CREATE TABLE public.citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    authors TEXT NOT NULL,
    title TEXT NOT NULL,
    journal TEXT NOT NULL DEFAULT '',
    year INTEGER,
    doi TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    citation_style TEXT NOT NULL DEFAULT 'IEEE'
        CHECK (citation_style IN ('APA', 'IEEE', 'Nature', 'Chicago', 'MLA')),
    context_snippet TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: public.quality_metrics
CREATE TABLE public.quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    score INTEGER NOT NULL
        CHECK (score >= 0 AND score <= 100),
    weight NUMERIC(3, 2) NOT NULL DEFAULT 0.20
        CHECK (weight >= 0.00 AND weight <= 1.00),
    status TEXT NOT NULL DEFAULT 'passed'
        CHECK (status IN ('passed', 'warning', 'critical')),
    findings TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    recommendations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: public.research_gaps
CREATE TABLE public.research_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    impact_potential TEXT NOT NULL DEFAULT 'Medium'
        CHECK (impact_potential IN ('High', 'Medium', 'Low')),
    suggested_methodology TEXT NOT NULL DEFAULT '',
    related_literature TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: public.audit_logs
-- NOTE ON DELETE STRATEGY:
--   - project_id ON DELETE CASCADE ensures complete removal when a manuscript is deleted.
--   - user_id ON DELETE SET NULL ensures forensic action history remains intact even
--     if an individual collaborator account is decommissioned.
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    user_name TEXT NOT NULL DEFAULT 'System',
    details TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'edit'
        CHECK (category IN ('edit', 'analysis', 'export', 'compliance', 'security')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_citations_project_id ON public.citations(project_id);
CREATE INDEX idx_citations_doi ON public.citations(doi);
CREATE INDEX idx_quality_metrics_project_id ON public.quality_metrics(project_id);
CREATE INDEX idx_research_gaps_project_id ON public.research_gaps(project_id);
CREATE INDEX idx_audit_logs_project_id ON public.audit_logs(project_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);

-- ------------------------------------------------------------------------------
-- 5. Triggers
-- ------------------------------------------------------------------------------

-- Auto-update updated_at on profiles
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.paperpilot_set_updated_at();

-- Auto-update updated_at on projects
DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.paperpilot_set_updated_at();

-- Safe profile trigger creation on auth.users:
-- Verifies catalog identity to avoid silent skip or collision with unrelated functions.
DO $$
DECLARE
    existing_trigger_fn_schema TEXT;
    existing_trigger_fn_name TEXT;
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'auth' AND c.relname = 'users'
    ) THEN
        -- Inspect if on_paperpilot_user_created already exists on auth.users
        SELECT fn_ns.nspname, p.proname
        INTO existing_trigger_fn_schema, existing_trigger_fn_name
        FROM pg_catalog.pg_trigger t
        JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
        JOIN pg_catalog.pg_namespace c_ns ON c_ns.oid = c.relnamespace
        JOIN pg_catalog.pg_proc p ON p.oid = t.tgfoid
        JOIN pg_catalog.pg_namespace fn_ns ON fn_ns.oid = p.pronamespace
        WHERE c_ns.nspname = 'auth'
          AND c.relname = 'users'
          AND t.tgname = 'on_paperpilot_user_created';

        IF existing_trigger_fn_name IS NOT NULL THEN
            IF existing_trigger_fn_schema = 'public' AND existing_trigger_fn_name = 'paperpilot_handle_new_user' THEN
                RAISE NOTICE 'Trigger on_paperpilot_user_created already exists on auth.users and correctly targets public.paperpilot_handle_new_user(). Retaining verified trigger.';
            ELSE
                RAISE EXCEPTION 'Trigger collision on auth.users: "on_paperpilot_user_created" exists but targets unexpected function "%.%" instead of "public.paperpilot_handle_new_user()". Aborting migration to prevent misconfiguration.',
                    existing_trigger_fn_schema, existing_trigger_fn_name;
            END IF;
        ELSE
            CREATE TRIGGER on_paperpilot_user_created
                AFTER INSERT ON auth.users
                FOR EACH ROW
                EXECUTE FUNCTION public.paperpilot_handle_new_user();
        END IF;
    ELSE
        RAISE NOTICE 'auth.users relation not found; profile trigger not attached.';
    END IF;
END
$$;

-- ------------------------------------------------------------------------------
-- 6. Row Level Security Activation
-- (Default-deny posture; permissive policies are added in Phase 3)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
