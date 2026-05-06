import pg from "pg";
import { getDatabaseUrl } from "./db-url.js";
const { Client } = pg;

const client = new Client({
  connectionString: getDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
});

const statements = [
  `DROP POLICY IF EXISTS "Users view own profile" ON public.profiles`,
  `CREATE POLICY "Users view profile" ON public.profiles FOR SELECT TO authenticated USING (true)`,
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
