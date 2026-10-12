
export type StructureCheckStatus = "detected" | "not_detected";

export interface StructureCheck {
  id: string;
  label: string;
  status: StructureCheckStatus;
  matchedHeading: string | null;
  explanation: string;
}

export interface DocumentStructureAudit {
  auditType: "document_structure";
  method: "heading_detection";
  checks: StructureCheck[];
  detectedCount: number;
  notDetectedCount: number;
  limitations: string[];
}

interface HeadingRule {
  id: string;
  label: string;
  pattern: RegExp;
}

const HEADING_RULES: HeadingRule[] = [
  {
    id: "abstract",
    label: "Abstract",
    pattern: /^abstract$/,
  },
  {
    id: "introduction",
    label: "Introduction",
    pattern: /^(?:introduction|background and introduction)$/,
  },
  {
    id: "related_work",
    label: "Related work or literature review",
    pattern:
      /^(?:related work|related studies|literature review|review of literature|background and related work)$/,
  },
  {
    id: "methodology",
    label: "Methodology or methods",
    pattern:
      /^(?:methodology|methods|materials and methods|research methodology|research methods|method and materials)$/,
  },
  {
    id: "results",
    label: "Results or findings",
    pattern: /^(?:results|findings|experimental results|results and findings)$/,
  },
  {
    id: "discussion",
    label: "Discussion",
    pattern: /^(?:discussion|results and discussion)$/,
  },
  {
    id: "limitations",
    label: "Limitations",
    pattern:
      /^(?:limitations|study limitations|limitations of the study|limitations and future work)$/,
  },
  {
    id: "conclusion",
    label: "Conclusion",
    pattern:
      /^(?:conclusion|conclusions|conclusion and future work|conclusions and future work)$/,
  },
  {
    id: "references",
    label: "References or bibliography",
    pattern:
      /^(?:references|bibliography|works cited|literature cited|reference list)$/,
  },
];

function normalizeHeading(line: string): string {
  return line
    .trim()
    .replace(/^[\s#*•\-]+/u, "")
    .replace(/^(?:(?:section\s+)?\d+(?:\.\d+)*|[IVXLCDM]+)[.)]?\s+/iu, "")
    .replace(/[:：]\s*$/u, "")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase("en-US");
}

function findHeading(
  lines: string[],
  pattern: RegExp,
): string | null {
  for (const line of lines) {
    const normalized = normalizeHeading(line);

    if (normalized && pattern.test(normalized)) {
      return line.trim();
    }
  }

  return null;
}

/**
 * Detects recognizable section headings in already-extracted document text.
 *
 * This is a structural heuristic only. It does not assess section quality,
 * scientific validity, plagiarism, novelty, or research readiness.
 * It makes no network calls and does not persist document content.
 */
export function auditDocumentStructure(
  documentText: string,
): DocumentStructureAudit {
  const lines = documentText
    .replace(/\r\n?/gu, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const checks: StructureCheck[] = HEADING_RULES.map((rule) => {
    const matchedHeading = findHeading(lines, rule.pattern);
    const detected = matchedHeading !== null;

    return {
      id: rule.id,
      label: rule.label,
      status: detected ? "detected" : "not_detected",
      matchedHeading,
      explanation: detected
        ? `A heading matching "${rule.label}" was detected. This does not establish that the section is complete or scientifically adequate.`
        : `No recognizable "${rule.label}" heading was detected. The section may be absent, use different wording, or have been extracted in a format this check cannot recognize.`,
    };
  });

  const detectedCount = checks.filter(
    (check) => check.status === "detected",
  ).length;

  return {
    auditType: "document_structure",
    method: "heading_detection",
    checks,
    detectedCount,
    notDetectedCount: checks.length - detectedCount,
    limitations: [
      "This check looks for recognizable section headings in extracted text only.",
      "A detected heading does not prove that its section contains adequate evidence or sound methodology.",
      "A missing heading does not prove that the corresponding content is absent.",
      "PDF extraction, unusual layouts, tables, and non-English headings may reduce detection accuracy.",
      "This audit does not measure plagiarism, AI-generated text, novelty, citation correctness, or research readiness.",
      "No AI provider or external service is used.",
    ],
  };
}
