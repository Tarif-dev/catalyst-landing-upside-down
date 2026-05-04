import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString:
    "postgresql://postgres:Catalyst_2k26()@db.cflowfufdavtjvxrewqd.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

const statements = [
  // 1. Create admins table
  `CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );`,

  // 2. Add is_winner to teams
  `DO $$ 
  BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='is_winner') THEN 
      ALTER TABLE public.teams ADD COLUMN is_winner BOOLEAN DEFAULT false; 
    END IF; 
  END $$;`,

  // 3. Enable RLS on admins
  `ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;`,

  // 4. RLS policy
  `DO $$ 
  BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'admins' AND policyname = 'Admins can view admins'
    ) THEN 
        CREATE POLICY "Admins can view admins" ON public.admins FOR SELECT USING (true);
    END IF; 
  END $$;`
];

async function run() {
  await client.connect();
  for (const sql of statements) {
    try {
      await client.query(sql);
      console.log("✓ Executed statement");
    } catch (e) {
      console.error("Error running SQL:", e.message);
    }
  }
  await client.end();
  console.log("\nMigration completed.");
}

run().catch(console.error);
