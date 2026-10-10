import type { Metadata } from 'next';
import './globals.css';
import { ProjectProvider } from '@/context/projectcontext';

export const metadata: Metadata = {
  title: 'PaperPilot AI — Manuscript Readiness & Journal Compliance Platform',
  description: 'AI-assisted academic research platform for automated manuscript readiness evaluation, journal compliance verification, peer-review risk detection, and seamless submission preparation.',
  openGraph: {
    title: 'PaperPilot AI',
    description: 'Autonomous pre-submission evaluation and academic formatting suite.',
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
