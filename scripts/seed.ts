/**
 * Seed niche_templates into Supabase.
 * Run: npx tsx scripts/seed.ts
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
import { NICHE_TEMPLATES } from "../src/lib/niches";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function seed() {
  console.log(`Seeding ${NICHE_TEMPLATES.length} niche templates…`);

  const { error } = await supabase
    .from("niche_templates")
    .upsert(NICHE_TEMPLATES, { onConflict: "niche_key" });

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  console.log("Done. Templates seeded:");
  NICHE_TEMPLATES.forEach((t) => console.log(`  ✓ ${t.niche_key} — ${t.display_name}`));
}

seed();
