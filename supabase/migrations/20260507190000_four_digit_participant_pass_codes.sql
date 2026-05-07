-- Participant event-pass codes should be short numeric codes.
-- Team join codes remain unchanged on public.teams.pass_code.

ALTER TABLE public.profiles ALTER COLUMN pass_code DROP NOT NULL;
DROP INDEX IF EXISTS public.profiles_pass_code_key;

UPDATE public.profiles SET pass_code = NULL;

CREATE OR REPLACE FUNCTION public.generate_participant_pass_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  LOOP
    v_code := lpad(floor(random() * 10000)::INT::TEXT, 4, '0');
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE pass_code = v_code
    );
  END LOOP;

  RETURN v_code;
END;
$$;

DO $$
DECLARE
  v_profile RECORD;
BEGIN
  FOR v_profile IN SELECT id FROM public.profiles ORDER BY created_at, id LOOP
    UPDATE public.profiles
    SET pass_code = public.generate_participant_pass_code()
    WHERE id = v_profile.id;
  END LOOP;
END;
$$;

ALTER TABLE public.profiles
  ALTER COLUMN pass_code SET DEFAULT public.generate_participant_pass_code();

ALTER TABLE public.profiles ALTER COLUMN pass_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_pass_code_key
  ON public.profiles (pass_code);
