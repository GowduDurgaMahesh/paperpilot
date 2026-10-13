
export type CitationConsistencyFinding = {
  code:
    | "UNCITED_REFERENCE"
    | "MISSING_REFERENCE"
    | "DUPLICATE_REFERENCE"
    | "UNSUPPORTED_CITATION_STYLE"
    | "REFERENCES_SECTION_NOT_FOUND";
  severity: "warning" | "info";
  message: string;
  citationNumber?: number;
};

export type CitationConsistencyResult = {
  citationStyle: "numbered" | "unsupported" | "unknown";
  inTextCitationNumbers: number[];
  referenceNumbers: number[];
  matchedNumbers: number[];
  findings: CitationConsistencyFinding[];
  summary: {
    inTextCitationCount: number;
    uniqueInTextCitationCount: number;
    referenceEntryCount: number;
    matchedCount: number;
    missingReferenceCount: number;
    uncitedReferenceCount: number;
    duplicateReferenceCount: number;
  };
  limitations: string[];
};

const MAX_TEXT_LENGTH = 200_000;

const BRACKETED_CITATION =
  /\[(\d{1,4}(?:\s*[,;]\s*\d{1,4})*)\]/gu;

const NUMBERED_REFERENCE =
  /(?:^|\n)\s*(?:\[(\d{1,4})\]|(\d{1,4})[.)])\s+\S/gu;

const REFERENCE_HEADING_LINE =
  /^\s*(?:references|bibliography|works\s+cited|literature\s+cited)\s*:?\s*$/iu;

const FLATTENED_REFERENCE_HEADING =
  /\b(?:references|bibliography|works\s+cited|literature\s+cited)\b\s*:?\s+(?=(?:\[\d{1,4}\]|\d{1,4}[.)])\s+\S)/iu;

const LIMITATIONS = [
  "Matching is based on citation numbers, not source identity or bibliographic content.",
  "Reference entries must start with [number], number., or number).",
  "A reference list using a different layout may be missed.",
  "Bracketed numbers in ordinary prose, tables, or examples can produce false positives.",
  "A matched number does not establish that the cited source supports the claim.",
  "No manuscript text is sent to an external provider or saved by this analysis function.",
];

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function parseBracketedNumbers(text: string): number[] {
  const numbers: number[] = [];

  for (const match of text.matchAll(BRACKETED_CITATION)) {
    const contents = match[1];

    if (!contents) {
      continue;
    }

    for (const part of contents.split(/[,;]/u)) {
      const number = Number(part.trim());

      if (Number.isInteger(number) && number > 0) {
        numbers.push(number);
      }
    }
  }

  return numbers;
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n?/gu, "\n")
    .replace(/\u00a0/gu, " ")
    .replace(/[ \t]+/gu, " ")
    .replace(/[ \t]*\n[ \t]*/gu, "\n")
    .trim();
}

function splitAtReferenceHeading(
  text: string,
): { bodyText: string; referenceText: string } | null {
  const lines = text.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    if (REFERENCE_HEADING_LINE.test(lines[index] ?? "")) {
      return {
        bodyText: lines.slice(0, index).join("\n").trim(),
        referenceText: lines.slice(index + 1).join("\n").trim(),
      };
    }
  }

  const match = FLATTENED_REFERENCE_HEADING.exec(text);

  if (!match || match.index === undefined) {
    return null;
  }

  return {
    bodyText: text.slice(0, match.index).trim(),
    referenceText: text
      .slice(match.index + match[0].length)
      .trim(),
  };
}

function countReferenceEntries(referenceText: string): Map<number, number> {
  const bracketedCounts = new Map<number, number>();

  // Match only bracketed reference labels, e.g. [1] Author. Title.
  // Do not interpret publication years such as 2022 as labels.
  const bracketedEntry =
    /(?:^|\s)\[(\d{1,4})\]\s+([\s\S]*?)(?=\s+\[\d{1,4}\]\s+|$)/gu;

  for (const match of referenceText.matchAll(bracketedEntry)) {
    const number = Number(match[1]);
    const entryText = match[2]?.trim();

    if (number > 0 && entryText) {
      bracketedCounts.set(
        number,
        (bracketedCounts.get(number) ?? 0) + 1,
      );
    }
  }

  if (bracketedCounts.size > 0) {
    return bracketedCounts;
  }

  // Fallback for numbered entries such as 1. Author. Title.
  const lineCounts = new Map<number, number>();

  for (const match of referenceText.matchAll(NUMBERED_REFERENCE)) {
    const number = Number(match[1] ?? match[2]);

    if (number > 0) {
      lineCounts.set(number, (lineCounts.get(number) ?? 0) + 1);
    }
  }

  if (lineCounts.size > 0) {
    return lineCounts;
  }

  // Last resort for flattened, unbracketed entries such as:
  // 1. First source details 2. Second source details
  const flattenedUnbracketed =
    /(?:^|\s)(\d{1,4})[.)]\s+([\s\S]*?)(?=\s+\d{1,4}[.)]\s+|$)/gu;

  for (const match of referenceText.matchAll(flattenedUnbracketed)) {
    const number = Number(match[1]);
    const entryText = match[2]?.trim();

    if (number > 0 && entryText) {
      lineCounts.set(number, (lineCounts.get(number) ?? 0) + 1);
    }
  }

  return lineCounts;
}

function buildUnknownResult(): CitationConsistencyResult {
  return {
    citationStyle: "unknown",
    inTextCitationNumbers: [],
    referenceNumbers: [],
    matchedNumbers: [],
    findings: [
      {
        code: "REFERENCES_SECTION_NOT_FOUND",
        severity: "warning",
        message:
          "No recognizable References, Bibliography, Works Cited, or Literature Cited heading followed by a numbered reference list was found.",
      },
      {
        code: "UNSUPPORTED_CITATION_STYLE",
        severity: "info",
        message:
          "Only numbered bracket citations such as [1] and [2, 3] are checked. Author-year, footnote, superscript, and other citation styles are not validated.",
      },
    ],
    summary: {
      inTextCitationCount: 0,
      uniqueInTextCitationCount: 0,
      referenceEntryCount: 0,
      matchedCount: 0,
      missingReferenceCount: 0,
      uncitedReferenceCount: 0,
      duplicateReferenceCount: 0,
    },
    limitations: [
      "A missing heading does not prove that the manuscript has no references.",
      "Only numbered citations in square brackets are supported.",
      ...LIMITATIONS.slice(2),
    ],
  };
}

export function analyzeCitationConsistency(
  manuscriptText: string,
): CitationConsistencyResult {
  if (!manuscriptText.trim()) {
    throw new Error("Provide manuscript text to analyze.");
  }

  if (manuscriptText.length > MAX_TEXT_LENGTH) {
    throw new Error(
      `Manuscript text must be ${MAX_TEXT_LENGTH.toLocaleString()} characters or fewer.`,
    );
  }

  const text = normalizeExtractedText(manuscriptText);
  const sections = splitAtReferenceHeading(text);

  if (!sections) {
    return buildUnknownResult();
  }

  const rawInTextNumbers = parseBracketedNumbers(sections.bodyText);
  const inTextNumbers = uniqueNumbers(rawInTextNumbers);
  const referenceCounts = countReferenceEntries(sections.referenceText);

  const referenceNumbers = uniqueNumbers([...referenceCounts.keys()]);
  const referenceSet = new Set(referenceNumbers);
  const inTextSet = new Set(inTextNumbers);

  const matchedNumbers = inTextNumbers.filter((number) =>
    referenceSet.has(number),
  );

  const missingNumbers = inTextNumbers.filter(
    (number) => !referenceSet.has(number),
  );

  const uncitedNumbers = referenceNumbers.filter(
    (number) => !inTextSet.has(number),
  );

  const duplicateNumbers = referenceNumbers.filter(
    (number) => (referenceCounts.get(number) ?? 0) > 1,
  );

  const findings: CitationConsistencyFinding[] = [];

  for (const number of missingNumbers) {
    findings.push({
      code: "MISSING_REFERENCE",
      severity: "warning",
      citationNumber: number,
      message: `In-text citation [${number}] has no matching numbered entry in the detected reference list.`,
    });
  }

  for (const number of uncitedNumbers) {
    findings.push({
      code: "UNCITED_REFERENCE",
      severity: "info",
      citationNumber: number,
      message: `Reference entry [${number}] was not found among the detected in-text citations.`,
    });
  }

  for (const number of duplicateNumbers) {
    findings.push({
      code: "DUPLICATE_REFERENCE",
      severity: "warning",
      citationNumber: number,
      message: `More than one reference entry uses number [${number}].`,
    });
  }

  findings.push({
    code: "UNSUPPORTED_CITATION_STYLE",
    severity: "info",
    message:
      "Only numbered bracket citations such as [1] and [2, 3] are checked. Author-year, footnote, superscript, and other citation styles are not validated.",
  });

  return {
    citationStyle: "numbered",
    inTextCitationNumbers: inTextNumbers,
    referenceNumbers,
    matchedNumbers,
    findings,
    summary: {
      inTextCitationCount: rawInTextNumbers.length,
      uniqueInTextCitationCount: inTextNumbers.length,
      referenceEntryCount: [...referenceCounts.values()].reduce(
        (total, count) => total + count,
        0,
      ),
      matchedCount: matchedNumbers.length,
      missingReferenceCount: missingNumbers.length,
      uncitedReferenceCount: uncitedNumbers.length,
      duplicateReferenceCount: duplicateNumbers.length,
    },
    limitations: LIMITATIONS,
  };
}
