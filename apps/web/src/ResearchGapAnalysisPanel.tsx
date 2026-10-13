import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:4000/api/research-gaps/analyze";

type GapType =
  | "stated_limitation"
  | "future_research"
  | "unanswered_question"
  | "missing_evidence";

type GapCandidate = {
  id: string;
  type: GapType;
  title: string;
  evidence: string;
  explanation: string;
  recommendation: string;
  verificationStatus: "requires_literature_review";
};

type GapReport = {
  reportType: "research_gap_analysis";
  method: "deterministic_manuscript_heuristics";
  verification: "not_verified_against_literature";
  candidates: GapCandidate[];
  summary: {
    candidateCount: number;
    statedLimitations: number;
    futureResearchItems: number;
    unansweredQuestions: number;
    missingEvidenceIndicators: number;
  };
  limitations: string[];
};

type ApiResponse = {
  report?: unknown;
  privacy?: {
    persisted: boolean;
    storage: string;
    externalServicesUsed: boolean;
  };
  error?: {
    code?: string;
    message?: string;
  };
};

type Props = {
  documentText: string;
};

const GAP_LABELS: Record<GapType, string> = {
  stated_limitation: "Stated limitation",
  future_research: "Future research",
  unanswered_question: "Unanswered question",
  missing_evidence: "Limited evidence",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGapReport(value: unknown): value is GapReport {
  if (!isRecord(value)) return false;

  const summary = value.summary;
  const candidates = value.candidates;
  const limitations = value.limitations;

  if (
    value.reportType !== "research_gap_analysis" ||
    value.method !== "deterministic_manuscript_heuristics" ||
    value.verification !== "not_verified_against_literature" ||
    !Array.isArray(candidates) ||
    !Array.isArray(limitations) ||
    !limitations.every((item) => typeof item === "string") ||
    !isRecord(summary)
  ) {
    return false;
  }

  const countKeys = [
    "candidateCount",
    "statedLimitations",
    "futureResearchItems",
    "unansweredQuestions",
    "missingEvidenceIndicators",
  ] as const;

  if (
    !countKeys.every(
      (key) =>
        typeof summary[key] === "number" &&
        Number.isInteger(summary[key]) &&
        (summary[key] as number) >= 0,
    ) ||
    summary.candidateCount !== candidates.length
  ) {
    return false;
  }

  const validTypes: GapType[] = [
    "stated_limitation",
    "future_research",
    "unanswered_question",
    "missing_evidence",
  ];

  return candidates.every(
    (candidate) =>
      isRecord(candidate) &&
      typeof candidate.id === "string" &&
      typeof candidate.title === "string" &&
      typeof candidate.evidence === "string" &&
      typeof candidate.explanation === "string" &&
      typeof candidate.recommendation === "string" &&
      validTypes.includes(candidate.type as GapType) &&
      candidate.verificationStatus === "requires_literature_review",
  );
}

export default function ResearchGapAnalysisPanel({
  documentText,
}: Props) {
  const [report, setReport] = useState<GapReport | null>(null);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const text = documentText.trim();

  useEffect(() => {
    setReport(null);
    setError("");
    setIsAnalyzing(false);
  }, [documentText]);

  async function analyzeGaps() {
    if (!text) {
      setReport(null);
      setError("No extracted manuscript text is available. Extract your PDF or DOCX text first.");
      return;
    }

    if (text.length > 2_000_000) {
      setReport(null);
      setError("The manuscript exceeds the 2,000,000-character analysis limit.");
      return;
    }

    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setError("");
    setReport(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText: text }),
      });

      let body: ApiResponse;

      try {
        body = (await response.json()) as ApiResponse;
      } catch {
        throw new Error("The API returned an invalid response. Check that the API server is running the expected version.");
      }

      if (!response.ok) {
        throw new Error(
          body.error?.message ??
            `Research gap analysis failed (HTTP ${response.status}).`,
        );
      }

      if (!isRecord(body) || !isGapReport(body.report)) {
        throw new Error(
          "The API returned an unexpected report. Ensure the API and web app use the same version.",
        );
      }

      setReport(body.report);
    } catch (cause) {
      setError(
        cause instanceof TypeError
          ? "Could not reach the API. Confirm that Paperpilot is running at 127.0.0.1:4000 and that the browser can access it."
          : cause instanceof Error
            ? cause.message
            : "Research gap analysis could not be completed.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <section className="text-panel" aria-labelledby="research-gap-heading">
      <div className="text-panel-heading">
        <div>
          <h3 id="research-gap-heading">Research Gap Analysis</h3>
          <p>
            Identify candidate research gaps from explicit statements in
            your manuscript.
          </p>
        </div>
      </div>

      <div style={{ padding: "18px" }}>
        <div className="notice">
          <strong>What this analysis can establish</strong>
          <p>
            It identifies wording about limitations, future research,
            unanswered questions, and limited evidence. It does not search
            the literature or prove that a gap is novel.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            margin: "16px 0",
          }}
        >
          {(
            [
              ["Limitations", "statedLimitations"],
              ["Future research", "futureResearchItems"],
              ["Unanswered questions", "unansweredQuestions"],
              ["Limited evidence", "missingEvidenceIndicators"],
            ] as const
          ).map(([label, key]) => (
            <div
              key={key}
              style={{
                flex: "1 1 140px",
                padding: "12px",
                border: "1px solid var(--border, #dce5dc)",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  color: "var(--muted, #59655e)",
                  fontSize: "12px",
                }}
              >
                {label}
              </div>
              <strong style={{ fontSize: "23px" }}>
                {report ? report.summary[key] : "—"}
              </strong>
            </div>
          ))}
        </div>

        <button
          className="button button-primary"
          type="button"
          onClick={analyzeGaps}
          disabled={isAnalyzing || !text}
        >
          {isAnalyzing ? (
            <>
              <span className="spinner" />
              Analyzing manuscript…
            </>
          ) : report ? (
            "Run analysis again"
          ) : (
            <>
              Identify candidate gaps
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>

        {error && (
          <div
            className="error-message"
            role="alert"
            style={{ marginTop: "16px" }}
          >
            <strong>Analysis could not be completed</strong>
            <p>{error}</p>
          </div>
        )}

        {isAnalyzing && (
          <p role="status" aria-live="polite">
            Analyzing the supplied text using deterministic rules. No
            literature search is being performed.
          </p>
        )}

        {report && (
          <div
            className="results"
            aria-live="polite"
            style={{ marginTop: "22px" }}
          >
            <div className="result-banner">
              <span className="success-icon" aria-hidden="true">
                ✓
              </span>
              <div className="result-banner-copy">
                <strong>
                  {report.summary.candidateCount} candidate
                  {report.summary.candidateCount === 1 ? "" : "s"} identified
                </strong>
                <span>
                  Based on manuscript wording, not verified literature gaps.
                </span>
              </div>
            </div>

            {report.candidates.length === 0 ? (
              <div className="notice">
                <strong>No explicit gap statements detected</strong>
                <p>
                  The analysis completed successfully, but its text rules
                  did not identify matching statements in this manuscript.
                  This does not mean that the manuscript has no research
                  gaps.
                </p>
                <p>
                  Your manuscript may describe a topic or its applications
                  without explicitly discussing limitations, future work,
                  unanswered questions, or limited evidence. Review those
                  areas manually or include the relevant statements if
                  they accurately reflect your research.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {report.candidates.map((candidate, index) => (
                  <article
                    key={candidate.id}
                    style={{
                      padding: "16px",
                      border: "1px solid var(--border, #dce5dc)",
                      borderRadius: "11px",
                      background: "var(--surface, #fff)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginBottom: "10px",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--green-light, #34704e)",
                          fontSize: "11px",
                          fontWeight: 800,
                          letterSpacing: "0.6px",
                          textTransform: "uppercase",
                        }}
                      >
                        Candidate {index + 1}
                      </span>

                      <span
                        style={{
                          padding: "5px 8px",
                          border: "1px solid var(--border, #dce5dc)",
                          borderRadius: "999px",
                          fontSize: "11px",
                        }}
                      >
                        {GAP_LABELS[candidate.type]}
                      </span>
                    </div>

                    <h4 style={{ margin: "0 0 12px" }}>
                      {candidate.title}
                    </h4>

                    <div
                      style={{
                        padding: "12px",
                        borderLeft:
                          "3px solid var(--green-light, #34704e)",
                        background: "var(--background, #f7f9f7)",
                        borderRadius: "0 8px 8px 0",
                        marginBottom: "14px",
                      }}
                    >
                      <strong style={{ fontSize: "12px" }}>
                        Supporting manuscript excerpt
                      </strong>
                      <p
                        style={{
                          margin: "7px 0 0",
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        “{candidate.evidence}”
                      </p>
                    </div>

                    <p style={{ lineHeight: 1.7 }}>
                      {candidate.explanation}
                    </p>

                    <div style={{ marginTop: "14px" }}>
                      <strong style={{ fontSize: "13px" }}>
                        Recommended next step
                      </strong>
                      <p style={{ lineHeight: 1.7 }}>
                        {candidate.recommendation}
                      </p>
                    </div>

                    <p
                      style={{
                        margin: "12px 0 0",
                        color: "var(--muted, #59655e)",
                        fontSize: "12px",
                      }}
                    >
                      Status: Requires literature review.
                    </p>
                  </article>
                ))}
              </div>
            )}

            <div className="notice">
              <strong>Analysis limitations</strong>
              <ul
                style={{
                  paddingLeft: "20px",
                  lineHeight: 1.8,
                  overflowWrap: "anywhere",
                }}
              >
                {report.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>

            <p
              style={{
                color: "var(--muted, #59655e)",
                fontSize: "11px",
                lineHeight: 1.7,
              }}
            >
              Method: deterministic manuscript heuristics. The API reports
              memory-only processing with no external services used for
              this analysis.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}