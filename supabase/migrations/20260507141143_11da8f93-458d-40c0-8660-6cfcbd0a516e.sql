
-- ============== ADMINS TABLE ==============
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;
CREATE POLICY "Admins can view admins"
  ON public.admins FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============== PROFILE COLUMNS ==============
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tshirt_size TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_complete BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'unpaid';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_ref TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pass_code TEXT;

UPDATE public.profiles
SET pass_code = upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))
WHERE pass_code IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN pass_code SET DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
ALTER TABLE public.profiles ALTER COLUMN pass_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_pass_code_key ON public.profiles(pass_code);

-- ============== TEAMS / SUBMISSIONS EXTRAS ==============
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS is_winner BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS problem_statement TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS solution_approach TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS tech_stack TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS screenshots TEXT[];

-- ============== STORAGE BUCKETS ==============
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes','resumes',false)
  ON CONFLICT (id) DO UPDATE SET public=excluded.public;
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions','submissions',true)
  ON CONFLICT (id) DO UPDATE SET public=excluded.public;

DROP POLICY IF EXISTS "Users can upload their own resume" ON storage.objects;
CREATE POLICY "Users can upload their own resume" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id='resumes' AND auth.uid()=owner);

DROP POLICY IF EXISTS "Users can view their own resume" ON storage.objects;
CREATE POLICY "Users can view their own resume" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id='resumes' AND auth.uid()=owner);

DROP POLICY IF EXISTS "Users can update their own resume" ON storage.objects;
CREATE POLICY "Users can update their own resume" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id='resumes' AND auth.uid()=owner)
  WITH CHECK (bucket_id='resumes' AND auth.uid()=owner);

DROP POLICY IF EXISTS "Admins can view all resumes" ON storage.objects;
CREATE POLICY "Admins can view all resumes" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id='resumes' AND EXISTS (SELECT 1 FROM public.admins WHERE admins.id=auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can upload submissions" ON storage.objects;
CREATE POLICY "Authenticated users can upload submissions" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id='submissions');

DROP POLICY IF EXISTS "Public can view submission files" ON storage.objects;
CREATE POLICY "Public can view submission files" ON storage.objects
  FOR SELECT USING (bucket_id='submissions');

-- ============== TEAM RPCS ==============
CREATE OR REPLACE FUNCTION public.join_team_by_code(p_code TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_team_id UUID; v_user_id UUID := auth.uid(); v_count INT; v_in BOOLEAN; v_p RECORD;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.team_members WHERE user_id=v_user_id) INTO v_in;
  IF v_in THEN RAISE EXCEPTION 'You are already in a team'; END IF;
  SELECT id INTO v_team_id FROM public.teams WHERE pass_code=upper(p_code);
  IF v_team_id IS NULL THEN RAISE EXCEPTION 'Invalid team code'; END IF;
  SELECT count(*) INTO v_count FROM public.team_members WHERE team_id=v_team_id;
  IF v_count >= 5 THEN RAISE EXCEPTION 'Team is full (max 5 members)'; END IF;
  SELECT full_name, email INTO v_p FROM public.profiles WHERE user_id=v_user_id;
  IF v_p.email IS NULL THEN RAISE EXCEPTION 'Profile missing — please sign in again'; END IF;
  INSERT INTO public.team_members (team_id, user_id, role, full_name, email)
  VALUES (v_team_id, v_user_id, 'member', COALESCE(v_p.full_name,'Member'), v_p.email);
  RETURN v_team_id;
END $$;

CREATE OR REPLACE FUNCTION public.leave_team()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid UUID := auth.uid(); v_tid UUID; v_role public.member_role;
BEGIN
  SELECT team_id, role INTO v_tid, v_role FROM public.team_members WHERE user_id=v_uid;
  IF v_tid IS NULL THEN RAISE EXCEPTION 'You are not in a team'; END IF;
  IF v_role='leader' THEN RAISE EXCEPTION 'Leader must transfer leadership or delete team'; END IF;
  DELETE FROM public.team_members WHERE team_id=v_tid AND user_id=v_uid;
END $$;

CREATE OR REPLACE FUNCTION public.change_team_leader(p_new_leader_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid UUID := auth.uid(); v_tid UUID; v_ok BOOLEAN;
BEGIN
  SELECT id INTO v_tid FROM public.teams WHERE leader_id=v_uid;
  IF v_tid IS NULL THEN RAISE EXCEPTION 'You are not a team leader'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.team_members WHERE team_id=v_tid AND user_id=p_new_leader_id) INTO v_ok;
  IF NOT v_ok THEN RAISE EXCEPTION 'New leader must be a team member'; END IF;
  UPDATE public.teams SET leader_id=p_new_leader_id WHERE id=v_tid;
  UPDATE public.team_members SET role='member' WHERE team_id=v_tid AND user_id=v_uid;
  UPDATE public.team_members SET role='leader' WHERE team_id=v_tid AND user_id=p_new_leader_id;
END $$;

CREATE OR REPLACE FUNCTION public.change_team_track(p_new_track public.track_kind)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid UUID := auth.uid(); v_tid UUID;
BEGIN
  SELECT id INTO v_tid FROM public.teams WHERE leader_id=v_uid;
  IF v_tid IS NULL THEN RAISE EXCEPTION 'Only the leader can change tracks'; END IF;
  UPDATE public.teams SET track=p_new_track WHERE id=v_tid;
END $$;

-- Block 'open' track
DROP TRIGGER IF EXISTS prevent_open_track ON public.teams;
CREATE OR REPLACE FUNCTION public.prevent_open_track()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.track='open'::public.track_kind THEN
    RAISE EXCEPTION 'Open Innovation is no longer an available track';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER prevent_open_track BEFORE INSERT OR UPDATE OF track ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.prevent_open_track();

-- Public pass verification
CREATE OR REPLACE FUNCTION public.verify_participant_pass(p_code TEXT)
RETURNS TABLE (
  participant_name TEXT, team_name TEXT,
  track public.track_kind, payment_status public.payment_status, issued_at TIMESTAMPTZ
)
LANGUAGE SQL SECURITY DEFINER SET search_path=public AS $$
  SELECT p.full_name, t.name, t.track, p.payment_status, p.created_at
  FROM public.profiles p
  LEFT JOIN public.team_members tm ON tm.user_id=p.user_id
  LEFT JOIN public.teams t ON t.id=tm.team_id
  WHERE p.pass_code = upper(p_code) LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.verify_participant_pass(TEXT) TO anon, authenticated;
