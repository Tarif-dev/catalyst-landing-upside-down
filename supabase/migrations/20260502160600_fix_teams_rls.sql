-- Fix: The "Members view team" SELECT policy only allowed access via is_team_member(),
-- but when an INSERT + SELECT (returning) is used, the SELECT runs before the
-- on_team_created trigger has a chance to insert the leader into team_members.
-- Adding leader_id = auth.uid() as a fast-path avoids this race condition.
DROP POLICY IF EXISTS "Members view team" ON public.teams;
CREATE POLICY "Members view team" ON public.teams
  FOR SELECT TO authenticated
  USING (
    leader_id = auth.uid()
    OR is_team_member(id, auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Same issue on team_members: the leader INSERT is done by a SECURITY DEFINER
-- trigger, but the SELECT after the teams insert may still fail to see it.
-- Allow users to always see team_member rows where they are the user.
DROP POLICY IF EXISTS "Team members view roster" ON public.team_members;
CREATE POLICY "Team members view roster" ON public.team_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_team_member(team_id, auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );
