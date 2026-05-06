const statements = [
  `DROP POLICY IF EXISTS "Members view team" ON public.teams`,
  `CREATE POLICY "Members view team" ON public.teams FOR SELECT TO authenticated USING (leader_id = auth.uid() OR is_team_member(id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))`,
  `DROP POLICY IF EXISTS "Team members view roster" ON public.team_members`,
  `CREATE POLICY "Team members view roster" ON public.team_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_team_member(team_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))`,
];

for (const sql of statements) {
  console.log("Running:", sql.slice(0, 60) + "...");
}
