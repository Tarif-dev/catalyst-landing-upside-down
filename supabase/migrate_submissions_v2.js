import pg from "pg";
import { getDatabaseUrl } from "./db-url.js";
const { Client } = pg;

const client = new Client({
  connectionString: getDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
});

const statements = [
  // Add tech_stack column to submissions
  `ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS tech_stack TEXT`,
  `ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS screenshots TEXT[]`,

  // Make resumes bucket public so admins can view/download them via signed URLs
  `UPDATE storage.buckets SET public = false WHERE id = 'resumes'`,

  // Create a screenshots/submission-media bucket (public for display)
  `INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', true) ON CONFLICT (id) DO NOTHING`,

  // Allow any authenticated user to upload to submissions bucket
  `CREATE POLICY "Authenticated users can upload submissions" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'submissions')`,

  // Allow anyone to view submission screenshots (they are public)
  `CREATE POLICY "Public can view submission files" ON storage.objects FOR SELECT USING (bucket_id = 'submissions')`,

  // Allow admins to read all resumes via service role (handled in policy)
  `DROP POLICY IF EXISTS "Admins can view all resumes" ON storage.objects`,
  `CREATE POLICY "Admins can view all resumes" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes' AND EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()))`,
];

async function run() {
  await client.connect();
  for (const sql of statements) {
    try {
      await client.query(sql);
      console.log("✓ " + sql.slice(0, 70));
    } catch (e) {
      if (
        e.message.includes("already exists") ||
        e.message.includes("duplicate")
      ) {
        console.log("↷ Skipped (exists): " + sql.slice(0, 60));
      } else {
        console.error("✗ Error: " + e.message + "\n  SQL: " + sql.slice(0, 80));
      }
    }
  }
  await client.end();
  console.log("\nDone.");
}

run().catch(console.error);
