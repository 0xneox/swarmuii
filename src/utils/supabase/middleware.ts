import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // Enhanced cookie options for Netlify PKCE compatibility
          const enhancedOptions = {
            ...options,
            httpOnly: false, // Allow client-side access for PKCE flow
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const, // More permissive for OAuth callbacks
            path: '/',
          };
          supabaseResponse.cookies.set(name, value, enhancedOptions)
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set(name, '', {
            ...options,
            maxAge: 0,
          })
        },
      },
    },
  );

  return { supabase, response: supabaseResponse };
};
