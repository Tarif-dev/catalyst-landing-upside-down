import { createClient } from '@supabase/supabase-js';

const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  console.log("Testing email_campaigns insert...");
  const { data: admins } = await supa.from("admins").select("id").limit(1);
  if (!admins || admins.length === 0) {
    console.log("No admins found");
    return;
  }

  const { data, error } = await supa.from("email_campaigns").insert({
    subject: "Test",
    body_html: "<p>Test</p>",
    target_filter: { type: "all" },
    status: "queued",
    total_count: 1,
    created_by: admins[0].id
  }).select("id");

  console.log("Data:", data);
  console.log("Error:", error);
}

run();
