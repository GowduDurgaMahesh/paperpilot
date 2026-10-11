import type { Metadata } from 'next';
import './globals.css';
import { ProjectProvider } from '@/context/projectcontext';

export const metadata: Metadata = {
  applicationName: 'Dr. Publish',
  title: 'Dr. Publish | Manuscript Readiness & Journal Compliance',
  description: 'From Research Draft to Publication Ready. Prepare manuscripts with readiness evaluation, journal compliance checks, peer-review risk detection, and submission support.',
  openGraph: {
    title: 'Dr. Publish',
    description: 'From Research Draft to Publication Ready. Manuscript readiness, journal compliance, and submission preparation in one place.',
    siteName: 'Dr. Publish',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Dr. Publish',
    description: 'From Research Draft to Publication Ready. Manuscript readiness, journal compliance, and submission preparation in one place.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F8F8] text-[#111111]">
        <ProjectProvider>
          {children}
        </ProjectProvider>
      </body>
    </html>
  );
}
