
import { describe, expect, it } from "vitest";
import {
  analyzeResearchQuality,
  type ResearchQualityFinding,
  type ResearchQualityReport,
} from "../apps/api/src/research-quality";

const completeManuscript = `
Abstract
This research examines an illustrative problem using a clearly described
approach. The study explains its purpose, summarizes the methods, and reports
the principal findings. The conclusions are limited to the example presented
in this manuscript and should be interpreted in context.

Introduction
This section introduces the research problem, describes its background,
explains why the question matters, and identifies the objective of the study.
It outlines the context and explains the motivation for the research.

Methodology
The research design uses a dataset containing 120 observations. The procedure
describes the sample selection, data collection, experimental protocol, and
statistical analysis. These details are included to help readers understand
how the study was conducted and how its findings were derived.

Results
The analysis measured the performance of the proposed approach. The observed
accuracy was 92%, and the results are summarized in Table 1. These figures are
illustrative test data for checking this software, not scientific findings.

Discussion
The findings are interpreted in relation to the research question. The
discussion considers possible explanations, alternative interpretations, and
the limits of the evidence. Additional research may be needed to examine
whether the observations generalize to other settings.

Conclusion
The example demonstrates how the proposed method can be described and
evaluated. The conclusion summarizes the work and acknowledges that further
validation would be needed before drawing broader scientific conclusions.

References
Example Author. 2025. Example reference used only for software testing.
`;

function getFinding(
  report: ResearchQualityReport,
  id: string,
): ResearchQualityFinding {
  const finding = report.findings.find((item) => item.id === id);

  if (!finding) {
    throw new Error(`Expected finding "${id}" was not returned`);
  }

  return finding;
}

describe("Research quality analysis engine", () => {
  it("returns the expected report format and method", () => {
    const report = analyzeResearchQuality(completeManuscript);

    expect(report.reportType).toBe("research_quality_review");
    expect(report.method).toBe("transparent_text_heuristics");
    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.limitations.length).toBeGreaterThan(0);
  });

  it("recognizes the expected sections in a complete manuscript", () => {
    const report = analyzeResearchQuality(completeManuscript);
    const finding = getFinding(report, "section-completeness");

    expect(finding.status).toBe("observed");
    expect(finding.explanation).toContain(
      "expected core sections",
    );
  });

  it("flags missing recognizable manuscript sections for review", () => {
    const report = analyzeResearchQuality(`
Introduction
A short introduction.

Conclusion
A short conclusion.
`);
    const finding = getFinding(report, "section-completeness");

    expect(finding.status).toBe("needs_review");
    expect(finding.explanation).toContain("Abstract");
    expect(finding.explanation).toContain("Methodology");
    expect(finding.explanation).toContain("References");
  });

  it("flags missing section content for review", () => {
    const report = analyzeResearchQuality(`
Introduction
This is a short introduction.
`);

    const abstractFinding = getFinding(report, "abstract-content");
    const methodologyFinding = getFinding(report, "methodology-content");

    expect(abstractFinding.status).toBe("needs_review");
    expect(methodologyFinding.status).toBe("needs_review");
    expect(abstractFinding.evidence).toEqual([]);
  });

  it("detects methodology design terms without claiming methodological validity", () => {
    const report = analyzeResearchQuality(completeManuscript);
    const finding = getFinding(report, "methodology-detail-indicator");

    expect(finding.status).toBe("observed");
    expect(finding.explanation).toContain(
      "does not verify that the method is appropriate or reproducible",
    );
  });

  it("flags methodology text without recognized design terms", () => {
    const report = analyzeResearchQuality(`
Methodology
We explain the process in general terms without describing specific procedures.
`);

    const finding = getFinding(report, "methodology-detail-indicator");

    expect(finding.status).toBe("needs_review");
    expect(finding.recommendation).toContain("research design");
  });

  it("detects recognizable results evidence indicators", () => {
    const report = analyzeResearchQuality(completeManuscript);
    const finding = getFinding(report, "results-evidence-indicator");

    expect(finding.status).toBe("observed");
    expect(finding.explanation).toContain(
      "validity and significance have not been verified",
    );
  });

  it("flags results without recognized evidence indicators", () => {
    const report = analyzeResearchQuality(`
Results
The observations are described in general terms without numerical
measurements or recognizable evidence indicators.
`);

    const finding = getFinding(report, "results-evidence-indicator");

    expect(finding.status).toBe("needs_review");
  });

  it("flags short sections as review triggers rather than universal failures", () => {
    const report = analyzeResearchQuality(`
Introduction
This section is brief.
`);

    const finding = getFinding(report, "introduction-content");

    expect(finding.status).toBe("needs_review");
    expect(finding.explanation).toContain("words were detected");
    expect(finding.explanation).toContain(
      "short sections can be appropriate",
    );
  });

  it("checks for reference-list text without verifying citation accuracy", () => {
    const report = analyzeResearchQuality(completeManuscript);
    const finding = getFinding(report, "reference-list-indicator");

    expect(finding.status).toBe("observed");
    expect(finding.explanation).toContain(
      "does not verify that they are valid or cited correctly",
    );
  });

  it("flags an empty reference list for review", () => {
    const report = analyzeResearchQuality(`
References
`);

    const finding = getFinding(report, "reference-list-indicator");

    expect(finding.status).toBe("needs_review");
  });

  it("handles empty input without throwing", () => {
    expect(() => analyzeResearchQuality("")).not.toThrow();

    const report = analyzeResearchQuality("");

    expect(report.findings.length).toBeGreaterThan(0);
    expect(
      getFinding(report, "section-completeness").status,
    ).toBe("needs_review");
  });

  it("keeps summary counts consistent with finding statuses", () => {
    const report = analyzeResearchQuality(completeManuscript);

    expect(report.summary.observed).toBe(
      report.findings.filter((item) => item.status === "observed").length,
    );

    expect(report.summary.notObserved).toBe(
      report.findings.filter((item) => item.status === "not_observed").length,
    );

    expect(report.summary.needsReview).toBe(
      report.findings.filter((item) => item.status === "needs_review").length,
    );

    expect(
      report.summary.observed +
        report.summary.notObserved +
        report.summary.needsReview,
    ).toBe(report.findings.length);
  });

  it("does not produce unsupported plagiarism, novelty, or readiness scores", () => {
    const report = analyzeResearchQuality(completeManuscript);
    const serialized = JSON.stringify(report);

    expect(report.limitations.join(" ")).toContain(
      "not a validated scientific-quality instrument",
    );
    expect(report.limitations.join(" ")).toContain("No plagiarism");
    expect(serialized).not.toContain('"plagiarismScore"');
    expect(serialized).not.toContain('"noveltyScore"');
    expect(serialized).not.toContain('"readinessScore"');
  });

  it("supports common numbered section headings", () => {
    const report = analyzeResearchQuality(`
1. Abstract
This is a numbered abstract.

2. Introduction
This is a numbered introduction.

3. Methodology
The sample was selected using a documented procedure.

4. Results
The measured accuracy was 90%.

5. Discussion
The results are discussed in context.

6. Conclusion
The study concludes with limitations.

7. References
Example reference.
`);

    expect(
      getFinding(report, "section-completeness").status,
    ).toBe("observed");
  });
});
