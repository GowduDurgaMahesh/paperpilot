
export type FindingSeverity = "info" | "review" | "warning";

export interface ResearchQualityFinding {
  id: string;
  title: string;
  severity: FindingSeverity;
  status: "observed" | "not_observed" | "needs_review";
  explanation: string;
  evidence: string[];
  recommendation: string;
}

export interface ResearchQualityReport {
  reportType: "research_quality_review";
  method: "transparent_text_heuristics";
  findings: ResearchQualityFinding[];
  summary: {
    observed: number;
    notObserved: number;
    needsReview: number;
  };
  limitations: string[];
}

interface SectionRule {
  id: string;
  title: string;
  headingPattern: RegExp;
}

interface SectionMatch {
  heading: string;
  content: string;
}

const SECTION_RULES: SectionRule[] = [
  { id: "abstract", title: "Abstract", headingPattern: /^abstract$/ },
  {
    id: "introduction",
    title: "Introduction",
    headingPattern: /^(?:introduction|background and introduction)$/,
  },
  {
    id: "methodology",
    title: "Methodology",
    headingPattern:
      /^(?:methodology|methods|materials and methods|research methodology|research methods)$/,
  },
  {
    id: "results",
    title: "Results",
    headingPattern: /^(?:results|findings|experimental results)$/,
  },
  {
    id: "discussion",
    title: "Discussion",
    headingPattern: /^(?:discussion|results and discussion)$/,
  },
  {
    id: "limitations",
    title: "Limitations",
    headingPattern:
      /^(?:limitations|study limitations|limitations of the study|limitations and future work)$/,
  },
  {
    id: "conclusion",
    title: "Conclusion",
    headingPattern:
      /^(?:conclusion|conclusions|conclusion and future work|conclusions and future work)$/,
  },
  {
    id: "references",
    title: "References",
    headingPattern:
      /^(?:references|bibliography|works cited|literature cited|reference list)$/,
  },
];

function normalizeHeading(line: string): string {
  return line
    .trim()
    .replace(/^[\s#*•\-]+/u, "")
    .replace(
      /^(?:(?:section\s+)?\d+(?:\.\d+)*|[IVXLCDM]+)[.)]?\s+/iu,
      "",
    )
    .replace(/[:：]\s*$/u, "")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase("en-US");
}

function findSections(text: string): Map<string, SectionMatch> {
  const lines = text.replace(/\r\n?/gu, "\n").split("\n");
  const headingLines = lines.map((line) => normalizeHeading(line));
  const sections = new Map<string, SectionMatch>();

  for (let index = 0; index < lines.length; index += 1) {
    const normalized = headingLines[index];
    const currentLine = lines[index];

    if (normalized === undefined || !normalized || currentLine === undefined) {
      continue;
    }

    const rule = SECTION_RULES.find((candidate) =>
      candidate.headingPattern.test(normalized),
    );

    if (!rule || sections.has(rule.id)) {
      continue;
    }

    let end = lines.length;

    for (let next = index + 1; next < lines.length; next += 1) {
      const nextHeading = headingLines[next];

      if (nextHeading === undefined || !nextHeading) {
        continue;
      }

      const isKnownHeading = SECTION_RULES.some((candidate) =>
        candidate.headingPattern.test(nextHeading),
      );

      if (isKnownHeading) {
        end = next;
        break;
      }
    }

    sections.set(rule.id, {
      heading: currentLine.trim(),
      content: lines.slice(index + 1, end).join("\n").trim(),
    });
  }

  return sections;
}

function wordsIn(text: string): string[] {
  return (
    text.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu) ?? []
  );
}

function evidenceExcerpt(
  text: string,
  maximumLength = 220,
): string[] {
  const compact = text.replace(/\s+/gu, " ").trim();

  if (!compact) {
    return [];
  }

  if (compact.length <= maximumLength) {
    return [compact];
  }

  return [`${compact.slice(0, maximumLength).trimEnd()}…`];
}

function createFinding(
  finding: ResearchQualityFinding,
): ResearchQualityFinding {
  return finding;
}

/**
 * Reviews extracted manuscript text using deterministic text heuristics.
 *
 * This function does not determine scientific correctness, prove evidence
 * quality, validate citations, detect plagiarism, or establish novelty.
 * It makes no network calls and does not persist document content.
 */
export function analyzeResearchQuality(
  documentText: string,
): ResearchQualityReport {
  const sections = findSections(documentText);
  const findings: ResearchQualityFinding[] = [];

  const expectedSections = [
    "abstract",
    "introduction",
    "methodology",
    "results",
    "discussion",
    "conclusion",
    "references",
  ];

  const missingSections = expectedSections.filter(
    (id) => !sections.has(id),
  );

  findings.push(
    createFinding({
      id: "section-completeness",
      title: "Expected manuscript sections",
      severity: missingSections.length > 0 ? "review" : "info",
      status: missingSections.length > 0 ? "needs_review" : "observed",
      explanation:
        missingSections.length > 0
          ? `Recognizable headings were not found for: ${missingSections
              .map(
                (id) =>
                  SECTION_RULES.find((section) => section.id === id)?.title ??
                  id,
              )
              .join(", ")}. Some formats or alternative heading names may not be recognized.`
          : "Recognizable headings were found for the expected core sections. Their presence does not establish that the content is adequate.",
      evidence: Array.from(sections.values()).map(
        (section) => section.heading,
      ),
      recommendation:
        "Check the target journal or institution's required structure and confirm that every required section is present.",
    }),
  );

  for (const sectionId of [
    "abstract",
    "introduction",
    "methodology",
    "results",
    "discussion",
    "conclusion",
  ]) {
    const section = sections.get(sectionId);
    const rule = SECTION_RULES.find(
      (candidate) => candidate.id === sectionId,
    );

    if (!rule) {
      continue;
    }

    if (!section) {
      findings.push(
        createFinding({
          id: `${sectionId}-content`,
          title: `${rule.title} content`,
          severity: "review",
          status: "needs_review",
          explanation:
            "This section could not be evaluated because a recognizable heading was not found.",
          evidence: [],
          recommendation:
            "Check whether the section exists under a different heading or whether text extraction preserved its heading.",
        }),
      );

      continue;
    }

    const wordCount = wordsIn(section.content).length;
    const shortSection = wordCount < 40;

    findings.push(
      createFinding({
        id: `${sectionId}-content`,
        title: `${rule.title} content length`,
        severity: shortSection ? "review" : "info",
        status: shortSection ? "needs_review" : "observed",
        explanation: shortSection
          ? `Only ${wordCount} words were detected before the next recognized section heading. This may indicate incomplete content, but short sections can be appropriate in some formats.`
          : `${wordCount} words were detected before the next recognized section heading. Word count alone does not establish content quality.`,
        evidence: evidenceExcerpt(section.content),
        recommendation: shortSection
          ? `Review the ${rule.title.toLowerCase()} section against the requirements for your paper type; do not add text merely to reach a word count.`
          : `Review whether the ${rule.title.toLowerCase()} section fulfills its purpose and supports its claims.`,
      }),
    );
  }

  const methodology = sections.get("methodology");

  if (methodology) {
    const designTerms =
      /\b(?:participants|dataset|data set|sample|sampling|experiment|experimental design|survey|interview|procedure|protocol|research design|inclusion criteria|exclusion criteria|statistical analysis|thematic analysis)\b/iu;

    const hasDesignIndicator = designTerms.test(methodology.content);

    findings.push(
      createFinding({
        id: "methodology-detail-indicator",
        title: "Methodology detail indicator",
        severity: hasDesignIndicator ? "info" : "review",
        status: hasDesignIndicator ? "observed" : "needs_review",
        explanation: hasDesignIndicator
          ? "At least one recognizable research-design or procedure term appears in the methodology text. This does not verify that the method is appropriate or reproducible."
          : "The methodology text did not contain the limited set of research-design terms checked by this heuristic. Equivalent descriptions may use other wording.",
        evidence: evidenceExcerpt(methodology.content),
        recommendation:
          "Confirm that the manuscript clearly explains the research design, data or participants, procedure, and analysis method where applicable.",
      }),
    );
  }

  const results = sections.get("results");

  if (results) {
    const evidenceTerms =
      /\b(?:n\s*=\s*\d+|p\s*[<=>]\s*0?\.\d+|confidence interval|standard deviation|mean|median|percentage|%|table\s+\d+|figure\s+\d+|dataset|measured|observed|participants|accuracy|precision|recall|f1[- ]score|auc)\b/iu;

    const hasEvidenceIndicator = evidenceTerms.test(results.content);

    findings.push(
      createFinding({
        id: "results-evidence-indicator",
        title: "Results evidence indicator",
        severity: hasEvidenceIndicator ? "info" : "review",
        status: hasEvidenceIndicator ? "observed" : "needs_review",
        explanation: hasEvidenceIndicator
          ? "At least one recognizable quantitative or evidence-related indicator appears in the results text. Its validity and significance have not been verified."
          : "The results text did not contain the limited evidence indicators checked. Qualitative findings or differently formatted evidence may not be recognized.",
        evidence: evidenceExcerpt(results.content),
        recommendation:
          "Check that each reported finding is supported by the appropriate data, analysis, examples, or qualitative evidence for the study design.",
      }),
    );
  }

  const references = sections.get("references");

  if (references) {
    const referenceLines = references.content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    findings.push(
      createFinding({
        id: "reference-list-indicator",
        title: "Reference-list indicator",
        severity: referenceLines.length > 0 ? "info" : "review",
        status: referenceLines.length > 0 ? "observed" : "needs_review",
        explanation:
          referenceLines.length > 0
            ? `${referenceLines.length} non-empty text line(s) were found after the References heading. This does not verify that they are valid or cited correctly.`
            : "No non-empty text lines were found after the References heading.",
        evidence: evidenceExcerpt(references.content),
        recommendation:
          "Verify each reference against its original source and check that in-text citations and the reference list match the required style.",
      }),
    );
  }

  const observed = findings.filter(
    (finding) => finding.status === "observed",
  ).length;

  const notObserved = findings.filter(
    (finding) => finding.status === "not_observed",
  ).length;

  const needsReview = findings.filter(
    (finding) => finding.status === "needs_review",
  ).length;

  return {
    reportType: "research_quality_review",
    method: "transparent_text_heuristics",
    findings,
    summary: {
      observed,
      notObserved,
      needsReview,
    },
    limitations: [
      "This is a deterministic text heuristic, not a validated scientific-quality instrument.",
      "A detected section or keyword does not prove methodological rigor, evidence validity, or scientific correctness.",
      "Missing indicators may reflect alternative terminology, document formatting, or extraction errors.",
      "The 40-word threshold is a review trigger only, not a universal manuscript requirement.",
      "No plagiarism, AI-generated text, novelty, citation accuracy, or research-readiness score is produced.",
      "The analysis uses only the supplied extracted text and makes no external-service calls.",
    ],
  };
}
