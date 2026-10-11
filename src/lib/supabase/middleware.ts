
import {
  createServerClient,
  type CookieOptions,
} from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isProtectedRoute =
    request.nextUrl.pathname === '/app' ||
    request.nextUrl.pathname.startsWith('/app/');

  if (!supabaseUrl || !supabaseKey) {
    if (isProtectedRoute) {
      return NextResponse.redirect(
        new URL('/auth/login', request.url)
      );
    }

    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },

        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });

          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },

        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });

          response = NextResponse.next({ request });
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  // Validate the user with Supabase Auth.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (isProtectedRoute && (!user || error)) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set(
      'next',
      request.nextUrl.pathname + request.nextUrl.search
    );

    return NextResponse.redirect(loginUrl);
  }

  if (
    user &&
    request.nextUrl.pathname === '/auth/login'
  ) {
    return NextResponse.redirect(
      new URL('/app/dashboard', request.url)
    );
  }

  return response;
}
