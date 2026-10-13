
export type CitationStyle = "numbered";

export type CitationStyleFinding = {
  code:
    | "REFERENCE_SECTION_NOT_FOUND"
    | "MALFORMED_REFERENCE"
    | "NUMBERING_GAP"
    | "DUPLICATE_REFERENCE_NUMBER"
    | "MISSING_AUTHOR"
    | "MISSING_TITLE"
    | "MISSING_PUBLICATION_DETAILS"
    | "INCONSISTENT_FORMATTING";
  severity: "warning" | "info";
  referenceNumber?: number;
  message: string;
  correction: string;
};

export type CitationStyleValidationResult = {
  selectedStyle: CitationStyle;
  detectedReferenceCount: number;
  findings: CitationStyleFinding[];
  summary: {
    warningCount: number;
    informationCount: number;
    malformedReferenceCount: number;
    numberingGapCount: number;
    duplicateNumberCount: number;
  };
  limitations: string[];
};

const MAX_TEXT_LENGTH = 200_000;

const HEADING =
  /^\s*(?:references|bibliography|works\s+cited|literature\s+cited)\s*:?\s*$/iu;

const ENTRY_START = /^\s*\[(\d{1,4})\]\s*(.*)$/u;

const LIMITATIONS = [
  "This validator checks structural heuristics, not the truth or completeness of publication metadata.",
  "A missing field is flagged only when it cannot be recognized in the extracted reference text.",
  "The numbered-reference rules do not establish full IEEE, APA, or other style compliance.",
  "PDF extraction may change punctuation, spacing, italics, and line breaks.",
  "No manuscript text is persisted or sent to an external provider by this validator.",
];

function normalizeText(value: string): string {
  return value
    .replace(/\r\n?/gu, "\n")
    .replace(/\u00a0/gu, " ")
    .replace(/[ \t]+/gu, " ")
    .trim();
}

function findReferenceSection(text: string): string | null {
  const lines = text.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    if (HEADING.test(lines[index] ?? "")) {
      return lines.slice(index + 1).join("\n").trim();
    }
  }

  // Accommodate PDF text where a heading and first entry share one line.
  const flattened = /\b(?:references|bibliography|works\s+cited|literature\s+cited)\b\s*:?\s+(?=\[\d{1,4}\]\s*\S)/iu;
  const match = flattened.exec(text);

  if (match && match.index !== undefined) {
    return text.slice(match.index + match[0].length).trim();
  }

  return null;
}

function parseEntries(section: string): Array<{
  number: number;
  text: string;
}> {
  const entries: Array<{ number: number; text: string }> = [];
  let current: { number: number; text: string } | null = null;

  for (const line of section.split("\n")) {
    const match = ENTRY_START.exec(line);

    if (match) {
      if (current) entries.push(current);

      current = {
        number: Number(match[1]),
        text: match[2]?.trim() ?? "",
      };
    } else if (current && line.trim()) {
      current.text = `${current.text} ${line.trim()}`.trim();
    }
  }

  if (current) entries.push(current);

  // Also split multiple entries that PDF extraction flattened onto one line.
  if (entries.length === 1) {
    const flattened = entries[0];

    if (flattened) {
      const parts = [...flattened.text.matchAll(/\[(\d{1,4})\]\s*/gu)];

      if (parts.length > 0) {
        const recovered: typeof entries = [];
        const firstMatch = parts[0];

        if (firstMatch?.index !== undefined && firstMatch.index > 0) {
          flattened.text = flattened.text.slice(0, firstMatch.index).trim();
        }

        for (let index = 0; index < parts.length; index += 1) {
          const part = parts[index];
          const next = parts[index + 1];

          if (!part || part.index === undefined) continue;

          const contentStart = part.index + part[0].length;
          const contentEnd = next?.index ?? flattened.text.length;
          const content = flattened.text.slice(contentStart, contentEnd).trim();

          if (content) {
            recovered.push({
              number: Number(part[1]),
              text: content,
            });
          }
        }

        if (recovered.length > 0) {
          return recovered;
        }
      }
    }
  }

  return entries;
}

function hasAuthor(text: string): boolean {
  return (
    /\b[A-Z][A-Za-z'’-]+(?:,\s*[A-Z](?:\.[A-Z]?)*\.?|\s+[A-Z]\.)/u.test(text) ||
    /\b(?:Anonymous|Anon\.)\b/iu.test(text) ||
    /\b[A-Z][A-Za-z'’-]+\s+(?:and|&)\s+[A-Z][A-Za-z'’-]+\b/u.test(text)
  );
}

function hasTitle(text: string): boolean {
  const cleaned = text
    .replace(/^\s*(?:[A-Z][A-Za-z'’-]+(?:,\s*[A-Z]\.?)?\s*){1,5}/u, "")
    .trim();

  return cleaned.length >= 8 && /[.!?:]/u.test(cleaned);
}

function hasPublicationDetails(text: string): boolean {
  return (
    /\b(?:19|20)\d{2}\b/u.test(text) ||
    /\b(?:doi|https?:\/\/|vol\.|volume|journal|conference|proceedings|publisher|pp\.)\b/iu.test(
      text,
    )
  );
}

export function validateCitationStyle(
  manuscriptText: string,
  selectedStyle: CitationStyle = "numbered",
): CitationStyleValidationResult {
  if (!manuscriptText.trim()) {
    throw new Error("Provide manuscript text to validate.");
  }

  if (manuscriptText.length > MAX_TEXT_LENGTH) {
    throw new Error(
      `Manuscript text must be ${MAX_TEXT_LENGTH.toLocaleString()} characters or fewer.`,
    );
  }

  const text = normalizeText(manuscriptText);
  const section = findReferenceSection(text);
  const findings: CitationStyleFinding[] = [];

  if (section === null) {
    findings.push({
      code: "REFERENCE_SECTION_NOT_FOUND",
      severity: "warning",
      message: "A recognizable numbered reference section was not found.",
      correction:
        "Add a References or Bibliography heading followed by numbered entries such as [1].",
    });

    return {
      selectedStyle,
      detectedReferenceCount: 0,
      findings,
      summary: {
        warningCount: 1,
        informationCount: 0,
        malformedReferenceCount: 0,
        numberingGapCount: 0,
        duplicateNumberCount: 0,
      },
      limitations: LIMITATIONS,
    };
  }

  const entries = parseEntries(section);
  const numberCounts = new Map<number, number>();
  const seenNumbers = new Set<number>();

  for (const entry of entries) {
    numberCounts.set(
      entry.number,
      (numberCounts.get(entry.number) ?? 0) + 1,
    );

    if (!entry.text.trim()) {
      findings.push({
        code: "MALFORMED_REFERENCE",
        severity: "warning",
        referenceNumber: entry.number,
        message: `Reference [${entry.number}] has no recognizable bibliographic text.`,
        correction:
          "Add the author, title, and available publication details for this entry.",
      });
      continue;
    }

    if (!hasAuthor(entry.text)) {
      findings.push({
        code: "MISSING_AUTHOR",
        severity: "warning",
        referenceNumber: entry.number,
        message: `Reference [${entry.number}] may be missing recognizable author information.`,
        correction:
          "Check the original source and add its author or organization. Do not invent author details.",
      });
    }

    if (!hasTitle(entry.text)) {
      findings.push({
        code: "MISSING_TITLE",
        severity: "warning",
        referenceNumber: entry.number,
        message: `Reference [${entry.number}] may be missing a recognizable title.`,
        correction:
          "Check the original source and include its publication title.",
      });
    }

    if (!hasPublicationDetails(entry.text)) {
      findings.push({
        code: "MISSING_PUBLICATION_DETAILS",
        severity: "info",
        referenceNumber: entry.number,
        message: `Reference [${entry.number}] may be missing a year, DOI, URL, venue, or other publication details.`,
        correction:
          "Verify the source and add applicable publication details. Some source types may not require every field.",
      });
    }
  }

  for (const [number, count] of numberCounts) {
    if (count > 1) {
      findings.push({
        code: "DUPLICATE_REFERENCE_NUMBER",
        severity: "warning",
        referenceNumber: number,
        message: `Reference number [${number}] occurs ${count} times.`,
        correction:
          "Assign each reference its correct unique number and update the corresponding in-text citations.",
      });
    }

    seenNumbers.add(number);
  }

  if (seenNumbers.size > 0) {
    const maximum = Math.max(...seenNumbers);

    for (let number = 1; number <= maximum; number += 1) {
      if (!seenNumbers.has(number)) {
        findings.push({
          code: "NUMBERING_GAP",
          severity: "warning",
          referenceNumber: number,
          message: `The reference list has no entry numbered [${number}].`,
          correction:
            "Check whether a reference entry was omitted or numbered incorrectly, then update affected citations.",
        });
      }
    }
  }

  const warningCount = findings.filter(
    (finding) => finding.severity === "warning",
  ).length;

  return {
    selectedStyle,
    detectedReferenceCount: entries.length,
    findings,
    summary: {
      warningCount,
      informationCount: findings.length - warningCount,
      malformedReferenceCount: findings.filter(
        (finding) => finding.code === "MALFORMED_REFERENCE",
      ).length,
      numberingGapCount: findings.filter(
        (finding) => finding.code === "NUMBERING_GAP",
      ).length,
      duplicateNumberCount: findings.filter(
        (finding) => finding.code === "DUPLICATE_REFERENCE_NUMBER",
      ).length,
    },
    limitations: LIMITATIONS,
  };
}
