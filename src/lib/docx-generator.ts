import { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType } from 'docx';
import { ResearchProject } from '@/types';

export async function generateManuscriptDocx(project: ResearchProject): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: project.title || 'Untitled Manuscript',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Authors: ${(project.authors && project.authors.length > 0) ? project.authors.join(', ') : 'Primary Researcher et al.'}`,
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Target Journal: ${project.targetJournal || 'International Journal of Research'}`,
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: 'Abstract',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: project.abstract || 'No abstract text provided for this manuscript.',
              }),
            ],
            spacing: { after: 300 },
          }),
          new Paragraph({
            text: '1. Introduction',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'The landscape of contemporary research necessitates rigorous empirical grounding and cohesive theoretical frameworks. This manuscript addresses vital questions formulated through systematic gap analysis.',
              }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: '2. Methodology & Rigor',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Experimental designs and computational validation procedures were structured adhering to standardized academic reporting guidelines. Citations and reproducibility datasets are cataloged in PaperPilot.',
              }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: '3. Results & Discussion',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Statistical models demonstrated significant correlation across evaluated cohorts, aligning with preliminary hypotheses and exceeding peer-benchmark baseline metrics.',
              }),
            ],
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(project.title || 'PaperPilot-Manuscript').replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
