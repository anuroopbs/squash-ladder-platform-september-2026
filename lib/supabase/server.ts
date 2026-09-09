import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client for use inside Server Components, Route
// Handlers, and Server Actions. Reads/writes the auth cookie so a signed-in
// user's session is available during server-side rendering.
export function createClient() {
    const cookieStore = cookies();

  return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
            cookies: {
                      getAll() {
                                  return cookieStore.getAll();
                      },
                      setAll(
                                  cookiesToSet: {
                                                name: string;
                                                value: string;
                                                options: CookieOptions;
                                  }[]
                                ) {
                                  try {
                                                cookiesToSet.forEach(({ name, value, options }) =>
                                                                cookieStore.set(name, value, options)
                                                                                 );
                                  } catch {
                                                // Called from a Server Component (no request/response to write
                                    // to) — safe to ignore as long as middleware refreshes sessions.
                                  }
                      },
            },
    }
      );
}
