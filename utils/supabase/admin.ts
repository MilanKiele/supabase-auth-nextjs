import { createClient as createBaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createBaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
