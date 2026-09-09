"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client — safe to use inside "use client" components.
// NEXT_PUBLIC_SUPABASE_ANON_KEY is Supabase's publishable key: it's designed
// to be shipped to the browser as long as RLS policies are in place (see
// sql/schema.sql — every table has RLS enabled).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
