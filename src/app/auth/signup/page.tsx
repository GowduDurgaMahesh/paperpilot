'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, ArrowRight, User, Mail, Lock, Building2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/auth/onboarding');
  };

  return (
    <div className="min-h-screen bg-brand-off-white flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-brand-light-gray shadow-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-brand-black">PaperPilot AI</span>
          </Link>
          <h1 className="text-xl font-bold text-brand-black">Create Researcher Account</h1>
          <p className="text-xs text-brand-gray">Empower your academic publishing with AI pre-submission audits</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-brand-dark mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-light-gray pl-9 focus:outline-none focus:border-brand-blue"
              />
              <User className="w-4 h-4 text-brand-gray absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Institutional Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@university.edu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-light-gray pl-9 focus:outline-none focus:border-brand-blue"
              />
              <Mail className="w-4 h-4 text-brand-gray absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">University / Research Institution</label>
            <div className="relative">
              <input
                type="text"
                required
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Stanford / MIT / Cambridge"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-light-gray pl-9 focus:outline-none focus:border-brand-blue"
              />
              <Building2 className="w-4 h-4 text-brand-gray absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            Continue to Onboarding <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-brand-gray pt-2 border-t border-brand-light-gray">
          Already registered?{' '}
          <Link href="/auth/login" className="text-brand-blue font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
