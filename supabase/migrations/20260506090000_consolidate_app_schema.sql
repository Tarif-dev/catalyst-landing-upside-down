-- Consolidates application changes that were previously applied by ad hoc
-- scripts, so new environments can be rebuilt from migrations alone.

CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;
CREATE POLICY "Admins can view admins"
  ON public.admins
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tshirt_size TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT false;

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS is_winner BOOLEAN DEFAULT false;

ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS problem_statement TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS solution_approach TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS tech_stack TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS screenshots TEXT[];

INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO UPDATE SET public = excluded.public;

INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO UPDATE SET public = excluded.public;

DROP POLICY IF EXISTS "Users can upload their own resume" ON storage.objects;
CREATE POLICY "Users can upload their own resume"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can view their own resume" ON storage.objects;
CREATE POLICY "Users can view their own resume"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can update their own resume" ON storage.objects;
CREATE POLICY "Users can update their own resume"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'resumes' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Admins can view all resumes" ON storage.objects;
CREATE POLICY "Admins can view all resumes"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes' AND EXISTS (
    SELECT 1 FROM public.admins WHERE admins.id = auth.uid()
  ));

DROP POLICY IF EXISTS "Authenticated users can upload submissions" ON storage.objects;
CREATE POLICY "Authenticated users can upload submissions"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'submissions');

DROP POLICY IF EXISTS "Public can view submission files" ON storage.objects;
CREATE POLICY "Public can view submission files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'submissions');

CREATE OR REPLACE FUNCTION public.join_team_by_code(p_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id UUID;
  v_user_id UUID := auth.uid();
  v_member_count INT;
  v_already_in_team BOOLEAN;
  v_profile RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.team_members WHERE user_id = v_user_id)
  INTO v_already_in_team;
  IF v_already_in_team THEN
    RAISE EXCEPTION 'You are already in a team';
  END IF;

  SELECT id INTO v_team_id FROM public.teams WHERE pass_code = upper(p_code);
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Invalid team code';
  END IF;

  SELECT count(*) INTO v_member_count FROM public.team_members WHERE team_id = v_team_id;
  IF v_member_count >= 5 THEN
    RAISE EXCEPTION 'Team is full (max 5 members)';
  END IF;

  SELECT full_name, email INTO v_profile FROM public.profiles WHERE user_id = v_user_id;
  IF v_profile.email IS NULL THEN
    RAISE EXCEPTION 'User profile not found. Please sign out and sign in again.';
  END IF;

  INSERT INTO public.team_members (team_id, user_id, role, full_name, email)
  VALUES (v_team_id, v_user_id, 'member', COALESCE(v_profile.full_name, 'Member'), v_profile.email);

  RETURN v_team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_team()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_team_id UUID;
  v_role public.member_role;
BEGIN
  SELECT team_id, role INTO v_team_id, v_role
  FROM public.team_members
  WHERE user_id = v_user_id;

  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'You are not in a team';
  END IF;

  IF v_role = 'leader' THEN
    RAISE EXCEPTION 'Leader cannot leave without transferring leadership first. Or delete the team instead.';
  END IF;

  DELETE FROM public.team_members WHERE team_id = v_team_id AND user_id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_team_leader(p_new_leader_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_team_id UUID;
  v_is_new_leader_in_team BOOLEAN;
BEGIN
  SELECT id INTO v_team_id FROM public.teams WHERE leader_id = v_user_id;
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'You are not the leader of any team';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.team_members
    WHERE team_id = v_team_id AND user_id = p_new_leader_id
  ) INTO v_is_new_leader_in_team;

  IF NOT v_is_new_leader_in_team THEN
    RAISE EXCEPTION 'New leader is not in your team';
  END IF;

  UPDATE public.teams SET leader_id = p_new_leader_id WHERE id = v_team_id;
  UPDATE public.team_members SET role = 'member' WHERE team_id = v_team_id AND user_id = v_user_id;
  UPDATE public.team_members SET role = 'leader' WHERE team_id = v_team_id AND user_id = p_new_leader_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_team_track(p_new_track public.track_kind)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_team_id UUID;
BEGIN
  SELECT id INTO v_team_id FROM public.teams WHERE leader_id = v_user_id;
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'You are not the leader of any team';
  END IF;

  UPDATE public.teams SET track = p_new_track WHERE id = v_team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_team()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_team_id UUID;
BEGIN
  SELECT id INTO v_team_id FROM public.teams WHERE leader_id = v_user_id;
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'You are not the leader of any team';
  END IF;

  DELETE FROM public.teams WHERE id = v_team_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_team_by_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_team() TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_team_leader(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_team_track(public.track_kind) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_team() TO authenticated;

DROP POLICY IF EXISTS "Members view team" ON public.teams;
CREATE POLICY "Members view team"
  ON public.teams
  FOR SELECT
  TO authenticated
  USING (
    leader_id = auth.uid()
    OR public.is_team_member(id, auth.uid())
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

DROP POLICY IF EXISTS "Leader updates team" ON public.teams;
CREATE POLICY "Leader updates team"
  ON public.teams
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = leader_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = leader_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

DROP POLICY IF EXISTS "Team members view roster" ON public.team_members;
CREATE POLICY "Team members view roster"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_team_member(team_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );
