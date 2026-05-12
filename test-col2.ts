import { createClient } from '@supabase/supabase-js';

const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data } = await supa.from("email_campaigns").select("*").limit(1);
  console.log(Object.keys(data![0]));
}

run();
