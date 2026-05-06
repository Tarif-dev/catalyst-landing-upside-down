import pg from "pg";
import { getDatabaseUrl } from "./db-url.js";
const { Client } = pg;

const client = new Client({
  connectionString: getDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
});

const statements = [
  // Add columns to profiles
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob DATE;`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_url TEXT;`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT;`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tshirt_size TEXT;`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT false;`,

  // Create Resumes bucket
  `INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false) ON CONFLICT (id) DO NOTHING;`,

  // Set RLS for resumes bucket
  // 1. Allow users to insert their own resume
  `CREATE POLICY "Users can upload their own resume" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resumes' AND auth.uid() = owner);`,

  // 2. Allow users to select their own resume
  `CREATE POLICY "Users can view their own resume" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes' AND auth.uid() = owner);`,

  // 3. Allow users to update their own resume
  `CREATE POLICY "Users can update their own resume" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'resumes' AND auth.uid() = owner);`,
];

async function run() {
  await client.connect();
  for (const sql of statements) {
    try {
      await client.query(sql);
      console.log("✓ Executed:", sql.substring(0, 60) + "...");
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log(
          "✓ Skipped (Already exists):",
          sql.substring(0, 60) + "...",
        );
      } else {
        console.error("Error executing:", sql, "\n", e.message);
      }
    }
  }
  await client.end();
  console.log("\nDatabase updated successfully.");
}

run().catch(console.error);
