import pg from "pg";
import { getDatabaseUrl } from "./db-url.js";
const { Client } = pg;

const client = new Client({
  connectionString: getDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
});

const args = process.argv.slice(2);
const email = args[0];

if (!email) {
  console.log("Usage: node add_admin.js <email>");
  process.exit(1);
}

async function run() {
  await client.connect();
  try {
    const { rows } = await client.query(
      "SELECT id FROM auth.users WHERE email = $1",
      [email],
    );
    if (rows.length === 0) {
      console.log(
        "User not found in auth.users. Please ensure they have logged in at least once or create them in the Supabase Dashboard.",
      );
    } else {
      const userId = rows[0].id;
      await client.query(
        "INSERT INTO public.admins (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
        [userId, email],
      );
      console.log(`✅ Successfully granted admin access to ${email}!`);
    }
  } catch (e) {
    console.error("Error adding admin:", e.message);
  } finally {
    await client.end();
  }
}

run();
