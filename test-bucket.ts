import { createClient } from '@supabase/supabase-js';
import * as dotenv from "dotenv";

// Manually load since bun handles it natively but let's be safe
const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  console.log("Checking buckets...");
  const { data: buckets } = await supa.storage.listBuckets();
  const exists = buckets?.find(b => b.name === "config");
  
  if (!exists) {
    console.log("Creating config bucket...");
    const { data, error } = await supa.storage.createBucket("config", {
      public: true,
      allowedMimeTypes: ["application/json"],
      fileSizeLimit: 1024 * 1024 // 1MB
    });
    console.log("Create result:", data, error);
  }
  
  console.log("Uploading settings.json...");
  const { data: uploadData, error: uploadError } = await supa.storage
    .from("config")
    .upload("settings.json", JSON.stringify({ registrationsOpen: true }), {
      contentType: "application/json",
      upsert: true
    });
    
  console.log("Upload result:", uploadData, uploadError);
}

run();
