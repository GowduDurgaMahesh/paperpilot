
export type ResearchGapType =
  | "stated_limitation"
  | "future_research"
  | "unanswered_question"
  | "missing_evidence";
export interface ResearchGapCandidate {
  id: string;
  type: ResearchGapType;
  title: string;
  evidence: string;
  explanation: string;
  recommendation: string;
  verificationStatus: "requires_literature_review";
}

export interface ResearchGapReport {
  reportType: "research_gap_analysis";
  method: "deterministic_manuscript_heuristics";
  verification: "not_verified_against_literature";
  candidates: ResearchGapCandidate[];
  summary: {
    candidateCount: number;
    statedLimitations: number;
    futureResearchItems: number;
    unansweredQuestions: number;
    missingEvidenceIndicators: number;
  };
  limitations: string[];
}

interface GapRule {
  type: ResearchGapType;
  title: string;
  pattern: RegExp;
  explanation: string;
  recommendation: string;
}

const GAP_RULES: GapRule[] = [
  {
    type: "stated_limitation",
    title: "Potential gap related to a stated limitation",
    pattern:
      /\b(?:limitation(?:s)? of this study|study limitation(?:s)?|a limitation of|one limitation is|limited generalizability|limited generalisability|small sample size|restricted sample|limited dataset|limited data set)\b/iu,
    explanation:
      "The manuscript explicitly mentions a limitation. This may indicate an area that needs further investigation, but a limitation is not automatically a research gap.",
    recommendation:
      "Identify which conclusions the limitation affects, then review recent relevant studies to determine whether the issue remains unresolved.",
  },
  {
    type: "future_research",
    title: "Potential gap suggested by future research",
    pattern:
      /\b(?:future work should|future research should|further research is needed|further studies are needed|future studies should|remains for future work|should be investigated in future|requires further investigation|future research could|future studies could|further investigation is required)\b/iu,
    explanation:
      "The manuscript suggests future investigation. The proposed direction may be a candidate research gap, but the manuscript alone cannot establish whether the literature has already addressed it.",
    recommendation:
      "Turn the proposed direction into a specific research question and check current literature for related methods, findings, and unresolved limitations.",
  },
  {
    type: "unanswered_question",
    title: "Potential unresolved research question",
    pattern:
      /\b(?:it remains unclear whether|it is unclear whether|has not yet been established|is not yet understood|remains unknown whether|little is known about|not well understood|unresolved question|unanswered question)\b/iu,
    explanation:
      "The manuscript describes an issue as uncertain or unresolved. This is a candidate gap statement, not independent proof that the question remains unanswered across the literature.",
    recommendation:
      "Search for studies that directly address the question, including contradictory results and work published after the cited studies.",
  },
  {
    type: "missing_evidence",
    title: "Potential gap related to limited evidence",
    pattern:
      /\b(?:lack of empirical evidence|insufficient empirical evidence|limited empirical evidence|lack of evidence|insufficient evidence|not evaluated in real[- ]world|has not been empirically tested|not validated on external data|no comparative evaluation|lack of comparative studies)\b/iu,
    explanation:
      "The manuscript indicates limited or missing evidence in a particular area. The statement may be a candidate gap, but other publications may already provide that evidence.",
    recommendation:
      "Define the evidence needed and compare the claim with relevant empirical studies, datasets, benchmarks, and systematic reviews.",
  },
];

const MAX_CANDIDATES = 20;
const MAX_EVIDENCE_LENGTH = 1000;

function normalizeText(text: string): string {
  // Join line-wrapped sentences while retaining blank lines between paragraphs.
  return text
    .replace(/\r\n?/gu, "\n")
    .replace(/[ \t]+/gu, " ")
    .replace(/[ \t]*\n[ \t]*/gu, "\n")
    .replace(/\n{2,}/gu, "\n\n");
}

function cleanExcerpt(text: string): string {
  const compact = text.replace(/\s+/gu, " ").trim();

  if (compact.length <= MAX_EVIDENCE_LENGTH) {
    return compact;
  }

  const sentenceEndPattern = /[.!?](?=\s|$)/gu;
  let lastSentenceEnd = -1;
  let match: RegExpExecArray | null;

  while ((match = sentenceEndPattern.exec(compact)) !== null) {
    if (match.index + 1 > MAX_EVIDENCE_LENGTH) {
      break;
    }

    lastSentenceEnd = match.index + 1;
  }

  if (lastSentenceEnd > 0) {
    return compact.slice(0, lastSentenceEnd).trim();
  }

  return `${compact.slice(0, MAX_EVIDENCE_LENGTH).trimEnd()}…`;
}

function sentenceContainingMatch(
  text: string,
  matchIndex: number,
): string {
  // Treat single newlines as line wrapping, not sentence endings.
  const precedingText = text.slice(0, matchIndex);
  const precedingBoundary = Math.max(
    precedingText.lastIndexOf("."),
    precedingText.lastIndexOf("!"),
    precedingText.lastIndexOf("?"),
  );

  let start = precedingBoundary + 1;

  // Keep the evidence inside the current paragraph.
  const previousParagraphBreak = text.lastIndexOf("\n\n", matchIndex);
  start = Math.max(start, previousParagraphBreak + 2);

  while (start < text.length && /\s/u.test(text[start] ?? "")) {
    start++;
  }

  let end = text.length;

  for (let i = matchIndex; i < text.length; i++) {
    const char = text[i];

    if (
      (char === "." || char === "!" || char === "?") &&
      (i + 1 === text.length || /\s/u.test(text[i + 1] ?? ""))
    ) {
      end = i + 1;
      break;
    }

    // Stop at the next paragraph, not at a single wrapped line.
    if (text.startsWith("\n\n", i)) {
      end = i;
      break;
    }
  }

  return cleanExcerpt(text.slice(start, end));
}

/**
 * Detects candidate research-gap statements from explicit wording in the
 * supplied manuscript.
 *
 * It does not search the literature, infer novelty, or establish whether a
 * research gap is scientifically valid. It makes no network calls and does
 * not persist document content.
 */
export function analyzeResearchGaps(
  documentText: string,
): ResearchGapReport {
  const text = normalizeText(documentText);
  const candidates: ResearchGapCandidate[] = [];
  const seenEvidence = new Set<string>();

  for (const rule of GAP_RULES) {
    const flags = rule.pattern.flags.replace(/g/gu, "");
    const pattern = new RegExp(rule.pattern.source, `${flags}g`);

    let match: RegExpExecArray | null;

    while (
      (match = pattern.exec(text)) !== null &&
      candidates.length < MAX_CANDIDATES
    ) {
      const evidence = sentenceContainingMatch(text, match.index);

      if (!evidence) {
        continue;
      }

      const deduplicationKey =
        `${rule.type}:${evidence.toLocaleLowerCase("en-US")}`;

      if (seenEvidence.has(deduplicationKey)) {
        continue;
      }

      seenEvidence.add(deduplicationKey);

      candidates.push({
        id: `gap-${candidates.length + 1}`,
        type: rule.type,
        title: rule.title,
        evidence,
        explanation: rule.explanation,
        recommendation: rule.recommendation,
        verificationStatus: "requires_literature_review",
      });
    }

    if (candidates.length >= MAX_CANDIDATES) {
      break;
    }
  }

  const countByType = (type: ResearchGapType): number =>
    candidates.filter((candidate) => candidate.type === type).length;

  return {
    reportType: "research_gap_analysis",
    method: "deterministic_manuscript_heuristics",
    verification: "not_verified_against_literature",
    candidates,
    summary: {
      candidateCount: candidates.length,
      statedLimitations: countByType("stated_limitation"),
      futureResearchItems: countByType("future_research"),
      unansweredQuestions: countByType("unanswered_question"),
      missingEvidenceIndicators: countByType("missing_evidence"),
    },
    limitations: [
      "Candidates are detected from wording in the supplied manuscript only.",
      "No external literature search or full-text review is performed by this engine.",
      "A stated limitation or future-work suggestion is not automatically a genuine research gap.",
      "Absence of detected candidates does not mean that the manuscript has no research gaps.",
      "The analysis does not establish novelty, plagiarism, scientific validity, or publication readiness.",
      "Results depend on text extraction, language, and the wording used by the author.",
      "No hosted AI provider or external service is used, and document text is not persisted.",
    ],
  };
}
