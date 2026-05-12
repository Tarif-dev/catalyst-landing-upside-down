-- ═══════════════════════════════════════════════════════════════
-- Migration: Discord verification + Email campaigns queue
-- Date: 2026-05-10
-- ═══════════════════════════════════════════════════════════════

-- 1. Add Discord columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS discord_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS discord_username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_in_discord BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Create email campaign status enum
DO $$ BEGIN
  CREATE TYPE public.campaign_status AS ENUM ('draft', 'queued', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create email job status enum
DO $$ BEGIN
  CREATE TYPE public.email_job_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Email campaigns table
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  target_filter JSONB NOT NULL DEFAULT '{"type":"all"}'::jsonb,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  sent_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Email jobs table
CREATE TABLE IF NOT EXISTS public.email_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  status public.email_job_status NOT NULL DEFAULT 'pending',
  error_msg TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Index for fast pending-job lookup
CREATE INDEX IF NOT EXISTS idx_email_jobs_pending
  ON public.email_jobs (status, created_at)
  WHERE status = 'pending';

-- 7. Index for campaign job counts
CREATE INDEX IF NOT EXISTS idx_email_jobs_campaign
  ON public.email_jobs (campaign_id, status);

-- 8. RLS for email_campaigns (admin-only via service role)
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

-- 9. RLS for email_jobs (admin-only via service role)
ALTER TABLE public.email_jobs ENABLE ROW LEVEL SECURITY;

-- 10. Allow service role to manage email_campaigns
CREATE POLICY IF NOT EXISTS "Service role manages campaigns"
  ON public.email_campaigns FOR ALL
  USING (auth.role() = 'service_role');

-- 11. Allow service role to manage email_jobs
CREATE POLICY IF NOT EXISTS "Service role manages jobs"
  ON public.email_jobs FOR ALL
  USING (auth.role() = 'service_role');
