import pg from "pg";
import { getDatabaseUrl } from "./db-url.js";
const { Client } = pg;

const client = new Client({
  connectionString: getDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
});

const statements = [
  // 1. Join Team by Code
  `CREATE OR REPLACE FUNCTION public.join_team_by_code(p_code TEXT)
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

  -- 1. Check if user is already in a team
  SELECT EXISTS(SELECT 1 FROM public.team_members WHERE user_id = v_user_id) INTO v_already_in_team;
  IF v_already_in_team THEN
    RAISE EXCEPTION 'You are already in a team';
  END IF;

  -- 2. Find team by code
  SELECT id INTO v_team_id FROM public.teams WHERE pass_code = p_code;
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Invalid team code';
  END IF;

  -- 3. Check member count
  SELECT count(*) INTO v_member_count FROM public.team_members WHERE team_id = v_team_id;
  IF v_member_count >= 5 THEN
    RAISE EXCEPTION 'Team is full (max 5 members)';
  END IF;

  -- 4. Get profile info
  SELECT full_name, email INTO v_profile FROM public.profiles WHERE user_id = v_user_id;
  IF v_profile.email IS NULL THEN
    RAISE EXCEPTION 'User profile not found. Please sign out and sign in again.';
  END IF;

  -- 5. Insert member
  INSERT INTO public.team_members (team_id, user_id, role, full_name, email)
  VALUES (v_team_id, v_user_id, 'member', COALESCE(v_profile.full_name, 'Member'), v_profile.email);

  RETURN v_team_id;
END;
$$;`,

  // 2. Leave Team
  `CREATE OR REPLACE FUNCTION public.leave_team()
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
  SELECT team_id, role INTO v_team_id, v_role FROM public.team_members WHERE user_id = v_user_id;
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'You are not in a team';
  END IF;

  IF v_role = 'leader' THEN
    RAISE EXCEPTION 'Leader cannot leave without transferring leadership first. Or delete the team instead.';
  END IF;

  DELETE FROM public.team_members WHERE team_id = v_team_id AND user_id = v_user_id;
END;
$$;`,

  // 3. Change Team Leader
  `CREATE OR REPLACE FUNCTION public.change_team_leader(p_new_leader_id UUID)
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
  -- Verify caller is the current leader
  SELECT id INTO v_team_id FROM public.teams WHERE leader_id = v_user_id;
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'You are not the leader of any team';
  END IF;

  -- Verify new leader is in the same team
  SELECT EXISTS(SELECT 1 FROM public.team_members WHERE team_id = v_team_id AND user_id = p_new_leader_id) INTO v_is_new_leader_in_team;
  IF NOT v_is_new_leader_in_team THEN
    RAISE EXCEPTION 'New leader is not in your team';
  END IF;

  -- Update teams table
  UPDATE public.teams SET leader_id = p_new_leader_id WHERE id = v_team_id;

  -- Update roles in team_members
  UPDATE public.team_members SET role = 'member' WHERE team_id = v_team_id AND user_id = v_user_id;
  UPDATE public.team_members SET role = 'leader' WHERE team_id = v_team_id AND user_id = p_new_leader_id;
END;
$$;`,

  // 4. Change Team Track
  `CREATE OR REPLACE FUNCTION public.change_team_track(p_new_track public.track_kind)
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
$$;`,

  // 5. Delete Team
  `CREATE OR REPLACE FUNCTION public.delete_team()
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
$$;`,
];

async function run() {
  await client.connect();
  for (const sql of statements) {
    try {
      await client.query(sql);
      console.log("✓ Created/Updated RPC");
    } catch (e) {
      console.error("Error running SQL:", e);
    }
  }
  await client.end();
  console.log("\nAll RPCs applied.");
}

run().catch(console.error);
