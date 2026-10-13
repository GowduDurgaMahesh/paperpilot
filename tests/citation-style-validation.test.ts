
import { describe, expect, it } from "vitest";
import { validateCitationStyle } from "../apps/api/src/citation-style-validation.js";

describe("validateCitationStyle", () => {
  it("accepts a numbered reference list with recognizable fields", () => {
    const text = [
      "Introduction",
      "Prior work supports this approach [1].",
      "",
      "References",
      "[1] Smith, J. (2023). Machine learning research methods. Journal of Computing, 12(2), 20-30. https://doi.org/10.1234/example",
      "[2] Brown, A. (2022). Data analysis techniques. Research Press.",
    ].join("\n");

    const result = validateCitationStyle(text);

    expect(result.selectedStyle).toBe("numbered");
    expect(result.detectedReferenceCount).toBe(2);
    expect(result.summary.numberingGapCount).toBe(0);
    expect(result.summary.duplicateNumberCount).toBe(0);
  });

  it("reports a missing reference section", () => {
    const result = validateCitationStyle(
      "Introduction\nEarlier research supports this method [1].",
    );

    expect(
      result.findings.some(
        (finding) => finding.code === "REFERENCE_SECTION_NOT_FOUND",
      ),
    ).toBe(true);
  });

  it("reports a numbering gap", () => {
    const text = [
      "References",
      "[1] Smith, J. (2023). Machine learning research methods. Journal of Computing.",
      "[3] Brown, A. (2022). Data analysis techniques. Research Press.",
    ].join("\n");

    const result = validateCitationStyle(text);

    expect(result.summary.numberingGapCount).toBe(1);
    expect(
      result.findings.some(
        (finding) =>
          finding.code === "NUMBERING_GAP" &&
          finding.referenceNumber === 2,
      ),
    ).toBe(true);
  });

  it("reports duplicate reference numbers", () => {
    const text = [
      "References",
      "[1] Smith, J. (2023). Machine learning research methods. Journal of Computing.",
      "[1] Brown, A. (2022). Data analysis techniques. Research Press.",
    ].join("\n");

    const result = validateCitationStyle(text);

    expect(result.summary.duplicateNumberCount).toBe(1);
    expect(
      result.findings.some(
        (finding) =>
          finding.code === "DUPLICATE_REFERENCE_NUMBER" &&
          finding.referenceNumber === 1,
      ),
    ).toBe(true);
  });

  it("flags a reference that may be missing author information", () => {
    const text = [
      "References",
      "[1] Machine learning research methods. Journal of Computing, 2023.",
    ].join("\n");

    const result = validateCitationStyle(text);

    expect(
      result.findings.some(
        (finding) =>
          finding.code === "MISSING_AUTHOR" &&
          finding.referenceNumber === 1,
      ),
    ).toBe(true);
  });

  it("rejects empty manuscript text", () => {
    expect(() => validateCitationStyle("   ")).toThrow(
      "Provide manuscript text to validate.",
    );
  });

  it("rejects text exceeding the supported length", () => {
    expect(() => validateCitationStyle("a".repeat(200_001))).toThrow(
      "Manuscript text must be",
    );
  });

  it("does not claim full IEEE or APA compliance", () => {
    const result = validateCitationStyle(
      [
        "References",
        "[1] Smith, J. (2023). Machine learning research methods. Journal of Computing.",
      ].join("\n"),
    );

    expect(
      result.limitations.some((limitation) =>
        limitation.includes("full IEEE, APA"),
      ),
    ).toBe(true);
  });
});
