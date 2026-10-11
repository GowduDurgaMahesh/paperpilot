
'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const professionalRoles = [
  'Undergraduate Student',
  'Postgraduate Student',
  'PhD Scholar',
  'Researcher',
  'Faculty / Professor',
  'Research Professional',
  'Independent Researcher',
  'Other',
];

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="h-5 w-5 shrink-0"
    >
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4.1 2-6.8 2-5.2 0-9.6-3.5-11.2-8.2H5.9v5.3A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.8 27.8a12 12 0 0 1 0-7.6v-5.3H5.9a20 20 0 0 0 0 18.2l6.9-5.3Z"
      />
      <path
        fill="#EA4335"
        d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.9 14.9l6.9 5.3C14.4 15.5 18.8 12 24 12Z"
      />
    </svg>
  );
}

function SignupForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    if (!role) {
      setError('Please select your professional role.');
      return;
    }

    if (password.length < 8) {
      setError('Your password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    if (!acceptedTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName.trim(),
            professional_role: role,
          },
        },
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      if (data.session) {
        router.replace('/auth/onboarding');
        router.refresh();
        return;
      }

      setMessage(
        'Your account request was received. Check your email for the verification link before signing in.'
      );
    } catch {
      setError("We couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setError('');
    setMessage('');
    setGoogleLoading(true);

    try {
      const supabase = createClient();

      const { error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/auth/onboarding')}`,
          },
        });

      if (oauthError) {
        setError(
          'Google signup could not be started. Check the OAuth configuration and try again.'
        );
        setGoogleLoading(false);
      }
    } catch {
      setError('Something went wrong starting Google signup.');
      setGoogleLoading(false);
    }
  }

  const isBusy = loading || googleLoading;

  return (
    <main className="min-h-screen bg-white text-[#212529] lg:grid lg:grid-cols-2">
      <section className="hidden min-h-screen flex-col justify-between bg-[#F8F9FA] p-12 lg:flex xl:p-16">
        <Link href="/auth/login" className="flex w-fit items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] text-white">
            <BookOpen size={21} aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Dr. Publish
          </span>
        </Link>

        <div className="mx-auto w-full max-w-md py-12">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-[#2563EB]">
            <FileCheck2 size={28} aria-hidden="true" />
          </div>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Your research.
            <br />
            Your next chapter.
          </h1>

          <p className="mt-5 max-w-md text-base leading-7 text-gray-600">
            From Research Draft to Publication Ready. Organize your research
            workflow and make informed publication decisions while staying in
            control of your work.
          </p>

          <div className="mt-9 space-y-5">
            {[
              'Keep your research workflow organized',
              'Review publication requirements',
              'Stay in control of every decision',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <ShieldCheck
                  size={19}
                  className="shrink-0 text-[#2563EB]"
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Built to assist researchers, not replace their judgment.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <Link
            href="/auth/login"
            className="mb-10 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#2563EB] lg:hidden"
          >
            <BookOpen size={20} aria-hidden="true" />
            Dr. Publish
          </Link>

          <div className="mb-8">
            <p className="mb-3 text-sm font-medium text-[#2563EB]">
              GET STARTED
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Create your account
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Set up your research workspace. You can complete your profile
              after creating your account.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800"
            >
              {message}
              <p className="mt-2">
                <Link
                  href="/auth/login"
                  className="font-medium underline underline-offset-2"
                >
                  Continue to sign in
                </Link>
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isBusy}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5 text-sm font-semibold text-[#212529] transition hover:bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E5E7EB]" />
            <span className="text-xs text-gray-500">
              OR SIGN UP WITH EMAIL
            </span>
            <div className="h-px flex-1 bg-[#E5E7EB]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium"
              >
                Full name
              </label>
              <input
                id="fullName"
                name="name"
                autoComplete="name"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Enter your full name"
                disabled={isBusy}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@university.edu"
                disabled={isBusy}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-medium"
              >
                Professional role
              </label>
              <select
                id="role"
                name="role"
                required
                value={role}
                onChange={(event) => setRole(event.target.value)}
                disabled={isBusy}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
              >
                <option value="" disabled>
                  Select your role
                </option>
                {professionalRoles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                Your role helps personalize your research workspace. It does
                not grant administrative access.
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  disabled={isBusy}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Enter your password again"
                  disabled={isBusy}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                  aria-label={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }
                  aria-pressed={showConfirmPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm leading-5 text-gray-600">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                disabled={isBusy}
                className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#2563EB]"
              />
              <span>
                I agree to the{' '}
                <Link
                  href="/terms"
                  className="font-medium text-[#2563EB] underline underline-offset-2"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  className="font-medium text-[#2563EB] underline underline-offset-2"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={isBusy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
              {!isBusy && <ArrowRight size={17} aria-hidden="true" />}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-[#2563EB] hover:text-blue-700"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-8 text-center text-xs leading-5 text-gray-500">
            Your research remains yours. Dr. Publish is designed to support
            your decisions, not make them for you.
          </p>
        </div>
      </section>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F8F9FA] text-sm text-gray-600">
          Loading signup…
        </main>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
