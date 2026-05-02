import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString:
    "postgresql://postgres:Catalyst_2k26()@db.cflowfufdavtjvxrewqd.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

const statements = [
  `DROP POLICY IF EXISTS "Members view team" ON public.teams`,
  `CREATE POLICY "Members view team" ON public.teams FOR SELECT TO authenticated USING (leader_id = auth.uid() OR is_team_member(id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))`,
  `DROP POLICY IF EXISTS "Team members view roster" ON public.team_members`,
  `CREATE POLICY "Team members view roster" ON public.team_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_team_member(team_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))`,
];

async function run() {
  await client.connect();
  for (const sql of statements) {
    await client.query(sql);
    console.log("✓ " + sql.slice(0, 70));
  }
  await client.end();
  console.log("\nAll policies updated successfully.");
}

run().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
