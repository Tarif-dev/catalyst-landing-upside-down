export function getDatabaseUrl() {
  const url = process.env.SUPABASE_DB_URL;

  if (!url) {
    throw new Error(
      "Missing SUPABASE_DB_URL. Set it to the Supabase Postgres connection string before running this script.",
    );
  }

  return url;
}
