
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'participant');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  college TEXT,
  course TEXT,
  year_of_study TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Teams
CREATE TYPE public.track_kind AS ENUM (
  'healthcare', 'fintech', 'sustainability', 'education', 'open'
);

CREATE TYPE public.payment_status AS ENUM ('unpaid', 'pending', 'paid', 'refunded');

CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  leader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track public.track_kind NOT NULL,
  tagline TEXT,
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  payment_ref TEXT,
  pass_code TEXT NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team members
CREATE TYPE public.member_role AS ENUM ('leader', 'member');

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'member',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  college TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id),
  UNIQUE (team_id, email)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Submissions
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES public.teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  repo_url TEXT,
  demo_url TEXT,
  video_url TEXT,
  attachment_url TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Certificates (admin-issued)
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  certificate_code TEXT NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  kind TEXT NOT NULL DEFAULT 'participation',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id, kind)
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Helper functions ---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_member(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members WHERE team_id = _team_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_leader(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams WHERE id = _team_id AND leader_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Auto-create profile + participant role + add leader as team member ------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'participant')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-add team leader as team_member
CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  leader_name TEXT;
  leader_email TEXT;
BEGIN
  SELECT COALESCE(full_name, email), email INTO leader_name, leader_email
  FROM public.profiles WHERE user_id = NEW.leader_id;

  INSERT INTO public.team_members (team_id, user_id, role, full_name, email)
  VALUES (NEW.id, NEW.leader_id, 'leader', COALESCE(leader_name, 'Leader'), COALESCE(leader_email, ''))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_team_created
AFTER INSERT ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.handle_new_team();

-- Enforce 2..5 members per team (excluding leader insert race-safe enough)
CREATE OR REPLACE FUNCTION public.check_team_member_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  member_count INT;
BEGIN
  SELECT COUNT(*) INTO member_count FROM public.team_members WHERE team_id = NEW.team_id;
  IF member_count >= 5 THEN
    RAISE EXCEPTION 'Team is full (max 5 members)';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_team_member_limit
BEFORE INSERT ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.check_team_member_limit();

-- Updated-at triggers
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER submissions_updated_at BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies -------------------------------------------------------------

-- profiles: users see/update own; admins see all
CREATE POLICY "Users view own profile" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- user_roles: read own; only admins write
CREATE POLICY "Users view own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- teams: members read; leader updates; anyone authenticated can create; admins all
CREATE POLICY "Members view team" ON public.teams
FOR SELECT TO authenticated USING (
  public.is_team_member(id, auth.uid()) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Authenticated create team" ON public.teams
FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Leader updates team" ON public.teams
FOR UPDATE TO authenticated USING (auth.uid() = leader_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete team" ON public.teams
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- team_members: members of same team can read; leader can add/remove; admins all
CREATE POLICY "Team members view roster" ON public.team_members
FOR SELECT TO authenticated USING (
  public.is_team_member(team_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Leader adds members" ON public.team_members
FOR INSERT TO authenticated WITH CHECK (
  public.is_team_leader(team_id, auth.uid()) OR auth.uid() = user_id
);
CREATE POLICY "Leader removes members" ON public.team_members
FOR DELETE TO authenticated USING (
  public.is_team_leader(team_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')
);

-- submissions: team members read/write; admins read
CREATE POLICY "Team members view submission" ON public.submissions
FOR SELECT TO authenticated USING (
  public.is_team_member(team_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Leader writes submission" ON public.submissions
FOR INSERT TO authenticated WITH CHECK (public.is_team_leader(team_id, auth.uid()));
CREATE POLICY "Leader updates submission" ON public.submissions
FOR UPDATE TO authenticated USING (public.is_team_leader(team_id, auth.uid()));

-- certificates: recipients read own; admins manage
CREATE POLICY "Users view own certificates" ON public.certificates
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage certificates" ON public.certificates
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
