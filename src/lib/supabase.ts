import { createClient } from "@supabase/supabase-js";

// Routes use Zod for input validation; Supabase generic typing is skipped
// to avoid version-specific Database type boilerplate.
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
