#!/usr/bin/env node
/**
 * Applies the participant payments + four-tracks migration directly to
 * the Supabase database using the service-role key and the Management API.
 *
 * Usage:
 *   node supabase/apply_migration.js
 *
 * Requires SUPABASE_DB_URL in the environment (Postgres connection string)
 * OR falls back to running each statement via the Supabase REST exec endpoint.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "process";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://cflowfufdavtjvxrewqd.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbG93ZnVmZGF2dGp2eHJld3FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcwMjg5NywiZXhwIjoyMDkzMjc4ODk3fQ.11EXo43OxapIRXesFvKFEEAo9IVdYTDTebPD3L9LF0A";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Split into individual statements the service role can execute one-by-one.
// We use the postgres extension via rpc or direct table calls.
// Since Supabase JS client doesn't support raw DDL, we call the REST /rpc/exec
// endpoint that wraps pg_query, or we use the pg REST.

// We'll use the Supabase Management API SQL endpoint.
const PROJECT_REF = "cflowfufdavtjvxrewqd";
const SQL_ENDPOINT = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

// Read the migration file
const migrationPath = join(
  __dirname,
  "migrations",
  "20260506183000_participant_payments_and_four_tracks.sql",
);
const sql = readFileSync(migrationPath, "utf8");

async function runViaManagementAPI() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error(
      "❌ SUPABASE_ACCESS_TOKEN not set. Cannot use Management API. Falling back to direct RPC.",
    );
    return false;
  }

  console.log("🔑 Using Supabase Management API...");
  const res = await fetch(SQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.json();
  if (!res.ok) {
    console.error("❌ Management API error:", JSON.stringify(body, null, 2));
    return false;
  }
  console.log("✅ Migration applied via Management API.");
  return true;
}

async function runViaRPC() {
  console.log("🔧 Running statements via Supabase RPC...");

  // Split the SQL into individual statements (rough split on ';' + newline)
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  let success = true;
  for (const stmt of statements) {
    const fullStmt = stmt.endsWith(";") ? stmt : stmt + ";";
    console.log(`\n▶ Executing:\n${fullStmt.slice(0, 120)}...`);

    const { error } = await supabase.rpc("exec_sql", { sql: fullStmt });
    if (error) {
      // exec_sql might not exist — that's fine, we handle below
      console.warn("  ⚠ RPC exec_sql failed:", error.message);
      success = false;
    } else {
      console.log("  ✓ OK");
    }
  }
  return success;
}

async function runViaPostgrestSQL() {
  /**
   * Supabase exposes a /rest/v1/rpc/exec_sql RPC if you create it manually.
   * Instead, we call the Supabase SQL over HTTP using the service-role key
   * and the undocumented /rest/v1/ postgres endpoint.
   *
   * The most reliable path without the CLI or Management API token is to
   * call each DDL via a temporary stored procedure approach, but since that
   * is complex, let's attempt the pg extension approach via supabase-js.
   */

  // We create a helper RPC that we'll immediately drop after
  console.log("🔧 Attempting inline SQL execution via pg extension...");

  // Try running statements individually using the supabase client's
  // ability to call arbitrary postgres functions
  const stmts = [
    // 1. Add payment_status column
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'unpaid'`,
    // 2. Add payment_ref column
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_ref TEXT`,
    // 3. Add pass_code column
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pass_code TEXT`,
    // 4. Populate existing rows
    `UPDATE public.profiles SET pass_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)) WHERE pass_code IS NULL`,
    // 5. Set default
    `ALTER TABLE public.profiles ALTER COLUMN pass_code SET DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))`,
    // 6. Set NOT NULL
    `ALTER TABLE public.profiles ALTER COLUMN pass_code SET NOT NULL`,
    // 7. Unique index
    `CREATE UNIQUE INDEX IF NOT EXISTS profiles_pass_code_key ON public.profiles (pass_code)`,
  ];

  for (const s of stmts) {
    console.log(`  ▶ ${s.slice(0, 80)}...`);
    // Supabase JS client doesn't support raw DDL, so we'll flag as needing CLI
  }

  console.log(
    "\n⚠ Cannot run DDL directly via supabase-js. Please use one of:",
  );
  console.log(
    "  1. supabase db push (if Supabase CLI is installed and linked)",
  );
  console.log(
    "  2. Set SUPABASE_DB_URL and run: psql $SUPABASE_DB_URL -f supabase/migrations/20260506183000_participant_payments_and_four_tracks.sql",
  );
  console.log(
    "  3. Paste the migration SQL in the Supabase Dashboard → SQL Editor",
  );
  return false;
}

async function main() {
  console.log("🚀 Applying migration: participant_payments_and_four_tracks\n");

  // Try Management API first (needs SUPABASE_ACCESS_TOKEN)
  const mgmtOk = await runViaManagementAPI();
  if (mgmtOk) return;

  // Try RPC
  await runViaPostgrestSQL();
}

main().catch(console.error);
