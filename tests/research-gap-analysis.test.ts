
import { describe, expect, it } from "vitest";
import { analyzeResearchGaps } from "../apps/api/src/research-gap-analysis";

describe("Research gap analysis engine", () => {
  it("detects a limitation and preserves supporting evidence", () => {
    const report = analyzeResearchGaps(`
Discussion
A limitation of this study is the small sample size, which may limit
generalizability to other populations.
`);

    expect(report.reportType).toBe("research_gap_analysis");
    expect(report.verification).toBe("not_verified_against_literature");
    expect(report.candidates.length).toBeGreaterThan(0);
    expect(report.candidates[0]?.type).toBe("stated_limitation");
    expect(report.candidates[0]?.evidence).toContain(
      "A limitation of this study is the small sample size, which may limit generalizability to other populations.",
    );
    expect(report.candidates[0]?.verificationStatus).toBe(
      "requires_literature_review",
    );
  });

  it("detects future research recommendations", () => {
    const report = analyzeResearchGaps(
      "Future research should evaluate this approach on independent datasets.",
    );

    expect(
      report.candidates.some(
        (candidate) => candidate.type === "future_research",
      ),
    ).toBe(true);
  });

  it("detects statements about unresolved questions", () => {
    const report = analyzeResearchGaps(
      "It remains unclear whether the approach generalizes to rural hospitals.",
    );

    expect(
      report.candidates.some(
        (candidate) => candidate.type === "unanswered_question",
      ),
    ).toBe(true);
  });

  it("detects limited empirical evidence", () => {
    const report = analyzeResearchGaps(
      "There is limited empirical evidence supporting this intervention.",
    );

    expect(
      report.candidates.some(
        (candidate) => candidate.type === "missing_evidence",
      ),
    ).toBe(true);
  });

  it("does not invent candidates when no recognized gap wording exists", () => {
    const report = analyzeResearchGaps(
      "This paper describes a method and presents experimental results.",
    );

    expect(report.candidates).toEqual([]);
    expect(report.summary.candidateCount).toBe(0);
  });

  it("keeps summary counts consistent with candidate types", () => {
    const report = analyzeResearchGaps(`
A limitation of this study is the limited dataset.
Future research should test additional datasets.
It remains unclear whether the findings generalize.
There is insufficient empirical evidence for this population.
`);

    expect(report.summary.candidateCount).toBe(report.candidates.length);
    expect(report.summary.statedLimitations).toBe(
      report.candidates.filter((item) => item.type === "stated_limitation")
        .length,
    );
    expect(report.summary.futureResearchItems).toBe(
      report.candidates.filter((item) => item.type === "future_research")
        .length,
    );
    expect(report.summary.unansweredQuestions).toBe(
      report.candidates.filter((item) => item.type === "unanswered_question")
        .length,
    );
    expect(report.summary.missingEvidenceIndicators).toBe(
      report.candidates.filter((item) => item.type === "missing_evidence")
        .length,
    );
  });

  it("caps the number of candidates at 20", () => {
    const text = Array.from(
      { length: 30 },
      (_, index) =>
        `Future research should investigate topic ${index + 1}.`,
    ).join("\n");

    const report = analyzeResearchGaps(text);

    expect(report.candidates.length).toBeLessThanOrEqual(20);
  });

  it("does not claim that literature review or novelty has been verified", () => {
    const report = analyzeResearchGaps(
      "Further research is needed to evaluate the method.",
    );
    const serialized = JSON.stringify(report);

    expect(report.verification).toBe("not_verified_against_literature");
    expect(report.limitations.join(" ")).toContain(
      "No external literature search or full-text review",
    );
    expect(serialized).not.toContain('"noveltyScore"');
    expect(serialized).not.toContain('"plagiarismScore"');
  });

  it("handles empty text without throwing", () => {
    expect(() => analyzeResearchGaps("")).not.toThrow();

    const report = analyzeResearchGaps("");

    expect(report.candidates).toEqual([]);
    expect(report.summary.candidateCount).toBe(0);
  });
});
