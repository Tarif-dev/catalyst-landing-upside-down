import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function resetDb() {
  console.log("Fetching all users...");
  const {
    data: { users },
    error: listErr,
  } = await supabase.auth.admin.listUsers();

  if (listErr) {
    console.error("Error fetching users:", listErr);
    process.exit(1);
  }

  console.log(`Found ${users.length} users. Deleting...`);

  for (const user of users) {
    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.error(`Failed to delete user ${user.email}:`, delErr);
    } else {
      console.log(`Deleted user ${user.email}`);
    }
  }

  console.log("Database reset complete.");
}

resetDb().catch(console.error);
