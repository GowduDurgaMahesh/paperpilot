
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function safeDestination(value: string | null): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/auth/')
  ) {
    return '/app/dashboard';
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = safeDestination(requestUrl.searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(
      new URL('/auth/login?error=confirmation_failed', requestUrl.origin)
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL('/auth/login?error=confirmation_failed', requestUrl.origin)
      );
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch {
    return NextResponse.redirect(
      new URL('/auth/login?error=confirmation_failed', requestUrl.origin)
    );
  }
}
