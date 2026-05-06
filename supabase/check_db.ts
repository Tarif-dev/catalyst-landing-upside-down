import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function check() {
  console.log("Checking teams and members...");
  const { data: teams, error: tErr } = await supabase.from("teams").select("*");
  console.log("Teams:", teams, tErr);

  const { data: members, error: mErr } = await supabase
    .from("team_members")
    .select("*");
  console.log("Members:", members, mErr);
}

check().catch(console.error);
