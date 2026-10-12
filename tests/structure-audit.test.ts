
import { describe, expect, it } from "vitest";
import { auditDocumentStructure } from "../apps/api/src/structure-audit.ts";

describe("Document structure audit", () => {
  it("detects common manuscript headings", () => {
    const result = auditDocumentStructure(`
      Abstract
      Introduction
      Related Work
      Methodology
      Results
      Discussion
      Limitations
      Conclusion
      References
    `);

    expect(result.auditType).toBe("document_structure");
    expect(result.method).toBe("heading_detection");
    expect(result.detectedCount).toBe(9);
    expect(result.notDetectedCount).toBe(0);
    expect(result.checks.every((check) => check.status === "detected")).toBe(
      true,
    );
  });

  it("detects numbered and subsection headings", () => {
    const result = auditDocumentStructure(`
      1 Introduction
      2. Related Work
      3.1 Research Methods
      4. Experimental Results
      5.1 Limitations of the Study
      6. Conclusions and Future Work
      7. References
    `);

    const detectedIds = result.checks
      .filter((check) => check.status === "detected")
      .map((check) => check.id);

    expect(detectedIds).toContain("introduction");
    expect(detectedIds).toContain("related_work");
    expect(detectedIds).toContain("methodology");
    expect(detectedIds).toContain("results");
    expect(detectedIds).toContain("limitations");
    expect(detectedIds).toContain("conclusion");
    expect(detectedIds).toContain("references");
  });

  it("reports missing headings without claiming the content is absent", () => {
    const result = auditDocumentStructure(`
      Introduction
      This paper explores a research problem.
      The approach is described in the following paragraphs.
    `);

    expect(result.detectedCount).toBe(1);
    expect(result.notDetectedCount).toBe(8);

    const abstract = result.checks.find(
      (check) => check.id === "abstract",
    );

    expect(abstract?.status).toBe("not_detected");
    expect(abstract?.matchedHeading).toBeNull();
    expect(abstract?.explanation).toContain(
      "The section may be absent",
    );
  });

  it("normalizes whitespace, line endings, and heading punctuation", () => {
    const result = auditDocumentStructure(
      "  ABSTRACT:  \r\n\r\n  METHODS  \r\n  CONCLUSION:  ",
    );

    expect(
      result.checks.find((check) => check.id === "abstract")?.status,
    ).toBe("detected");

    expect(
      result.checks.find((check) => check.id === "methodology")?.status,
    ).toBe("detected");

    expect(
      result.checks.find((check) => check.id === "conclusion")?.status,
    ).toBe("detected");
  });

  it("returns consistent results for empty text", () => {
    const result = auditDocumentStructure("");

    expect(result.checks).toHaveLength(9);
    expect(result.detectedCount).toBe(0);
    expect(result.notDetectedCount).toBe(9);
    expect(result.limitations.length).toBeGreaterThan(0);
  });

  it("does not mistake ordinary prose containing a heading word for a heading", () => {
    const result = auditDocumentStructure(`
      This paper discusses the methodology used in the experiment.
      Our conclusion is that further research is needed.
      References to prior work appear throughout the paper.
    `);

    expect(
      result.checks.find((check) => check.id === "methodology")?.status,
    ).toBe("not_detected");

    expect(
      result.checks.find((check) => check.id === "conclusion")?.status,
    ).toBe("not_detected");

    expect(
      result.checks.find((check) => check.id === "references")?.status,
    ).toBe("not_detected");
  });

  it("explicitly lists limitations and does not claim to detect plagiarism or novelty", () => {
    const result = auditDocumentStructure("Abstract\nIntroduction");

    expect(
      result.limitations.some((item) => item.includes("plagiarism")),
    ).toBe(true);

    expect(
      result.limitations.some((item) => item.includes("novelty")),
    ).toBe(true);

    expect(result.auditType).toBe("document_structure");
  });
});
