import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

export const createClient = async () => {
  const cookieStore = await cookies();
  
  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Enhanced cookie options for Netlify PKCE compatibility
            const enhancedOptions = {
              ...options,
              httpOnly: false, // Allow client-side access for PKCE flow
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const, // More permissive for OAuth callbacks
              path: '/',
            };
            cookieStore.set(name, value, enhancedOptions);
          } catch (error) {
            console.warn('Failed to set cookie in server component:', error);
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set(name, '', {
              ...options,
              maxAge: 0,
            });
          } catch (error) {
            console.warn('Failed to remove cookie in server component:', error);
          }
        },
      },
    },
  );
};
