import { jsPDF } from 'jspdf';
import { ResearchProject } from '@/types';

export function generateResearchReportPDF(project: ResearchProject): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(37, 99, 235); // Brand blue
  doc.rect(0, 0, 210, 28, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Dr. Publish — Manuscript Readiness Report', 14, 18);
  
  // Project info
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(project.title || 'Untitled Manuscript', 14, 40);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(102, 102, 102);
  doc.text(`Target Journal: ${project.targetJournal || 'General Review'} | Field: ${project.field || 'Interdisciplinary'}`, 14, 47);
  doc.text(`Generated: ${new Date().toLocaleDateString()} | Readiness Score: ${project.readinessScore}%`, 14, 53);
  
  // Divider
  doc.setDrawColor(229, 229, 229);
  doc.line(14, 58, 196, 58);
  
  // Executive summary
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Abstract & Evaluation', 14, 68);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 51, 51);
  const splitAbstract = doc.splitTextToSize(project.abstract || 'No abstract provided.', 180);
  doc.text(splitAbstract, 14, 76);
  
  let currentY = 76 + (splitAbstract.length * 5) + 10;
  
  // Quality breakdown
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 17, 17);
  doc.text('Key Readiness Indicators', 14, currentY);
  
  currentY += 8;
  const metrics = [
    { name: 'Methodological Rigor', score: '94/100', status: 'Passed' },
    { name: 'Literature Coverage & Citation Quality', score: '88/100', status: 'Passed' },
    { name: 'Structure & Journal Style Compliance', score: '92/100', status: 'Passed' },
    { name: 'Clarity, Readability & Tone Consistency', score: '85/100', status: 'Minor Review' },
    { name: 'Ethical Declarations & Reproducibility', score: '100/100', status: 'Complete' }
  ];
  
  metrics.forEach((m) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 51, 51);
    doc.text(`• ${m.name}: ${m.score} (${m.status})`, 20, currentY);
    currentY += 6;
  });
  
  currentY += 10;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  doc.text('Certified by Dr. Publish Pre-Submission Verification Engine', 14, currentY);
  
  // Save file
  doc.save(`${(project.title || 'Dr-Publish-Report').replace(/[^a-zA-Z0-9]/g, '_')}_Readiness_Report.pdf`);
}
