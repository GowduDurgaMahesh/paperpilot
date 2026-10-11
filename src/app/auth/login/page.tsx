
'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, ArrowRight, Lock, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z"
      />
      <path
        fill="#EA4335"
        d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z"
      />
    </svg>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function getDestination() {
    const requestedPath = searchParams.get('next');

    if (
      requestedPath &&
      requestedPath.startsWith('/') &&
      !requestedPath.startsWith('//') &&
      !requestedPath.startsWith('/auth/')
    ) {
      return requestedPath;
    }

    return '/app/dashboard';
  }

  useEffect(() => {
    if (searchParams.get('error') === 'confirmation_failed') {
      setError(
        'Authentication could not be completed. Please try again or request a new confirmation link.'
      );
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setError('Unable to sign in. Check your email and password.');
        return;
      }

      router.replace(getDestination());
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const destination = getDestination();

      const { error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`,
          },
        });

      if (oauthError) {
        setError(`Google sign-in failed: ${oauthError.message}`);
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? `Google sign-in failed: ${err.message}`
          : 'Unable to start Google sign-in. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-off-white flex flex-col justify-center items-center px-4 py-10">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-brand-light-gray shadow-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white font-bold">
              <FileText className="w-5 h-5" />
            </div>

            <span className="text-xl font-bold text-brand-black">
              Dr. Publish
            </span>
          </Link>

          <p className="text-xs text-brand-gray">
            From Research Draft to Publication Ready.
          </p>

          <h1 className="text-xl font-bold text-brand-black">
            Researcher Sign In
          </h1>

          <p className="text-xs text-brand-gray">
            Access your academic manuscripts and evaluation audits
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 rounded-xl border border-brand-light-gray bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed text-brand-black font-semibold transition-all flex items-center justify-center gap-3"
        >
          <GoogleIcon />
          {loading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3 text-xs text-brand-gray">
          <div className="h-px flex-1 bg-brand-light-gray" />
          <span>OR CONTINUE WITH EMAIL</span>
          <div className="h-px flex-1 bg-brand-light-gray" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label
              htmlFor="login-email"
              className="block font-bold text-brand-dark mb-1"
            >
              Institutional Email
            </label>

            <div className="relative">
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-light-gray pl-9 focus:outline-none focus:border-brand-blue disabled:opacity-60"
              />

              <Mail className="w-4 h-4 text-brand-gray absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="login-password"
                className="block font-bold text-brand-dark"
              >
                Password
              </label>

              <Link
                href="/auth/reset-password"
                className="text-brand-blue font-semibold hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-light-gray pl-9 focus:outline-none focus:border-brand-blue disabled:opacity-60"
              />

              <Lock className="w-4 h-4 text-brand-gray absolute left-3 top-3" />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-red-600 text-sm break-words">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-blue hover:bg-brand-blue-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? 'Signing in...' : 'Sign In to Workspace'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center text-xs text-brand-gray pt-2 border-t border-brand-light-gray">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/signup"
            className="text-brand-blue font-semibold hover:underline"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
          <p className="text-sm text-brand-gray">Loading sign in...</p>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
