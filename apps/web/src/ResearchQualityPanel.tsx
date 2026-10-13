import { useState } from "react";

const API_URL = "http://127.0.0.1:4000/api/research-quality/analyze";

type FindingSeverity = "info" | "review" | "warning";

type FindingStatus =
  | "observed"
  | "not_observed"
  | "needs_review";

type ResearchQualityFinding = {
  id: string;
  title: string;
  severity: FindingSeverity;
  status: FindingStatus;
  explanation: string;
  evidence: string[];
  recommendation: string;
};

type ResearchQualityReport = {
  reportType: string;
  method: string;
  findings: ResearchQualityFinding[];
  summary: Record<string, unknown>;
  limitations: string[];
};

type ApiResponse = {
  report?: ResearchQualityReport;
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
  filename: string;
};

function severityLabel(severity: FindingSeverity): string {
  switch (severity) {
    case "warning":
      return "Warning";
    case "review":
      return "Review";
    default:
      return "Information";
  }
}

function statusLabel(status: FindingStatus): string {
  switch (status) {
    case "observed":
      return "Observed";
    case "not_observed":
      return "Not observed";
    default:
      return "Needs review";
  }
}

function isValidReport(
  value: unknown,
): value is ResearchQualityReport {
  if (!value || typeof value !== "object") {
    return false;
  }

  const report = value as Partial<ResearchQualityReport>;

  return (
    typeof report.reportType === "string" &&
    typeof report.method === "string" &&
    Array.isArray(report.findings) &&
    Array.isArray(report.limitations) &&
    report.findings.every(
      (finding) =>
        finding !== null &&
        typeof finding === "object" &&
        typeof finding.id === "string" &&
        typeof finding.title === "string" &&
        ["info", "review", "warning"].includes(
          finding.severity,
        ) &&
        [
          "observed",
          "not_observed",
          "needs_review",
        ].includes(finding.status) &&
        typeof finding.explanation === "string" &&
        Array.isArray(finding.evidence) &&
        finding.evidence.every(
          (item) => typeof item === "string",
        ) &&
        typeof finding.recommendation === "string",
    )
  );
}

export default function ResearchQualityPanel({
  documentText,
  filename,
}: Props) {
  const [report, setReport] =
    useState<ResearchQualityReport | null>(null);

  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function runReview() {
    const text = documentText.trim();

    if (!text) {
      setError(
        "No extracted text is available. Upload a text-based PDF or DOCX document first.",
      );
      return;
    }

    if (text.length > 2_000_000) {
      setError(
        "The extracted text exceeds the 2,000,000-character review limit.",
      );
      return;
    }

    if (isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setReport(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentText: text,
        }),
      });

      const body = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(
          body.error?.message ??
            `Research quality review failed (HTTP ${response.status}).`,
        );
      }

      if (!isValidReport(body.report)) {
        throw new Error(
          "The API returned an unexpected report format. Please check that the API and web app use the same version.",
        );
      }

      setReport(body.report);
    } catch (cause) {
      setError(
        cause instanceof TypeError
          ? "Could not reach the API. Confirm that the API server is running at 127.0.0.1:4000."
          : cause instanceof Error
            ? cause.message
            : "An unexpected error occurred during the review.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <section
      className="text-panel research-quality-panel"
      aria-labelledby="research-quality-heading"
    >
      <div className="text-panel-heading">
        <div>
          <h3 id="research-quality-heading">
            Research Quality Review
          </h3>
          <p>
            Transparent text-based checks for areas that may
            need further attention.
          </p>
        </div>
      </div>

      <div className="research-quality-document">
        <span className="research-quality-label">
          Manuscript
        </span>
        <strong>{filename}</strong>
        <span className="research-quality-meta">
          {documentText.length.toLocaleString()} characters
        </span>
      </div>

      <p>
        This review checks recognizable research sections
        and selected text indicators. Findings are prompts
        for human review, not a verdict on scientific quality.
      </p>

      <div className="research-quality-actions">
        <button
          className="button button-primary"
          type="button"
          onClick={runReview}
          disabled={isAnalyzing || !documentText.trim()}
        >
          {isAnalyzing ? (
            <>
              <span className="spinner" />
              Reviewing manuscript…
            </>
          ) : report ? (
            "Run review again"
          ) : (
            "Run research quality review"
          )}
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          <strong>Review could not be completed</strong>
          <p>{error}</p>
        </div>
      )}

      {isAnalyzing && (
        <p role="status" aria-live="polite">
          The API is analyzing the extracted text. Please
          wait…
        </p>
      )}

      {report && (
        <div
          className="research-quality-results"
          aria-live="polite"
        >
          <div className="result-banner">
            <span className="success-icon" aria-hidden="true">
              ✓
            </span>
            <div className="result-banner-copy">
              <strong>Review completed</strong>
              <span>
                {report.findings.length} findings returned by
                the review engine
              </span>
            </div>
          </div>

          <div className="notice">
            <strong>How to interpret this report</strong>
            <p>
              The findings are generated by deterministic
              text heuristics. A missing text indicator does
              not prove that the underlying research is
              missing or incorrect. Review the manuscript
              before acting on any recommendation.
            </p>
          </div>

          {report.findings.length === 0 ? (
            <div className="notice">
              <strong>No findings returned</strong>
              <p>
                The engine did not return any findings for
                this document. This does not certify the
                manuscript as complete or scientifically
                sound.
              </p>
            </div>
          ) : (
            <div className="research-quality-findings">
              {report.findings.map((finding) => (
                <article
                  className="research-quality-finding"
                  key={finding.id}
                >
                  <div className="research-quality-finding-header">
                    <h4>{finding.title}</h4>

                    <div className="research-quality-tags">
                      <span
                        className={`research-quality-tag severity-${finding.severity}`}
                      >
                        {severityLabel(finding.severity)}
                      </span>

                      <span className="research-quality-tag">
                        {statusLabel(finding.status)}
                      </span>
                    </div>
                  </div>

                  <p>{finding.explanation}</p>

                  {finding.evidence.length > 0 && (
                    <div className="research-quality-evidence">
                      <strong>Evidence</strong>
                      <ul>
                        {finding.evidence.map(
                          (evidence, index) => (
                            <li
                              key={`${finding.id}-evidence-${index}`}
                            >
                              {evidence}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="research-quality-recommendation">
                    <strong>Suggested next step</strong>
                    <p>{finding.recommendation}</p>
                  </div>
                </article>
              ))}
            </div>
          )}

          {report.limitations.length > 0 && (
            <div className="notice">
              <strong>Limitations</strong>
              <ul>
                {report.limitations.map(
                  (limitation, index) => (
                    <li key={`limitation-${index}`}>
                      {limitation}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          <div className="research-quality-footer">
            <span>
              Method: {report.method}
            </span>
            <span>
              No research-quality score is calculated by
              this panel.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}