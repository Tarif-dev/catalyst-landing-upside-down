-- Move registration payment tracking from teams to individual participants.
-- The existing team pass_code remains the team join/access code.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'unpaid';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_ref TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pass_code TEXT;

UPDATE public.profiles
SET pass_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
WHERE pass_code IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN pass_code SET DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

ALTER TABLE public.profiles
  ALTER COLUMN pass_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_pass_code_key
  ON public.profiles (pass_code);

DROP TRIGGER IF EXISTS prevent_open_track ON public.teams;

CREATE OR REPLACE FUNCTION public.prevent_open_track()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.track = 'open'::public.track_kind THEN
    RAISE EXCEPTION 'Open Innovation is no longer an available track';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_open_track
BEFORE INSERT OR UPDATE OF track ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.prevent_open_track();

CREATE OR REPLACE FUNCTION public.verify_participant_pass(p_code TEXT)
RETURNS TABLE (
  participant_name TEXT,
  team_name TEXT,
  track public.track_kind,
  payment_status public.payment_status,
  issued_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.full_name AS participant_name,
    t.name AS team_name,
    t.track AS track,
    p.payment_status AS payment_status,
    p.created_at AS issued_at
  FROM public.profiles p
  LEFT JOIN public.team_members tm ON tm.user_id = p.user_id
  LEFT JOIN public.teams t ON t.id = tm.team_id
  WHERE p.pass_code = upper(p_code)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_participant_pass(TEXT) TO anon, authenticated;
