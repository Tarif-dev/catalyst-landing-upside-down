-- Repair bulk email schema to match the application runtime.
-- The app stores campaign body in public.email_campaigns.body, keeps
-- target_filter as JSON text, and uses text statuses so campaigns can be
-- terminated without fighting older enum definitions.

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text NOT NULL DEFAULT '',
  target_filter text NOT NULL DEFAULT '{"type":"all"}',
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending'
);

ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS body text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS target_filter text NOT NULL DEFAULT '{"type":"all"}',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'email_campaigns'
      AND column_name = 'body_html'
  ) THEN
    EXECUTE 'UPDATE public.email_campaigns SET body = body_html WHERE body = '''' AND body_html IS NOT NULL';
    EXECUTE 'ALTER TABLE public.email_campaigns ALTER COLUMN body_html DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'email_campaigns'
      AND column_name = 'target_filter'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.email_campaigns
      ALTER COLUMN target_filter TYPE text
      USING COALESCE(target_filter::text, '{"type":"all"}');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'email_campaigns'
      AND column_name = 'status'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.email_campaigns
      ALTER COLUMN status TYPE text
      USING status::text;
  END IF;
END $$;

UPDATE public.email_campaigns
SET target_filter = '{"type":"all"}'
WHERE target_filter IS NULL OR btrim(target_filter) = '';

UPDATE public.email_campaigns
SET status = 'queued'
WHERE status IS NULL OR status IN ('draft', 'pending');

CREATE TABLE IF NOT EXISTS public.email_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  recipient_name text,
  status text NOT NULL DEFAULT 'pending',
  error_msg text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_jobs
  ADD COLUMN IF NOT EXISTS recipient_name text,
  ADD COLUMN IF NOT EXISTS error_msg text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'email_jobs'
      AND column_name = 'status'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.email_jobs
      ALTER COLUMN status TYPE text
      USING status::text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_jobs_pending
  ON public.email_jobs (status, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_email_jobs_campaign
  ON public.email_jobs (campaign_id, status);

NOTIFY pgrst, 'reload schema';
