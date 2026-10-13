
import { useState } from "react";

const API_URL = "http://127.0.0.1:4000/api/citation-consistency/analyze";

type Finding = {
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

type AnalysisResult = {
  citationStyle: "numbered" | "unsupported" | "unknown";
  inTextCitationNumbers: number[];
  referenceNumbers: number[];
  matchedNumbers: number[];
  findings: Finding[];
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

type ApiResponse = {
  result?: AnalysisResult;
  privacy?: {
    persisted: boolean;
    storage: string;
    externalServicesUsed: boolean;
  };
  error?: {
    message?: string;
  };
};

type Props = {
  documentText: string;
};

function findingLabel(code: Finding["code"]): string {
  switch (code) {
    case "MISSING_REFERENCE":
      return "Missing reference";
    case "UNCITED_REFERENCE":
      return "Uncited reference";
    case "DUPLICATE_REFERENCE":
      return "Duplicate reference number";
    case "REFERENCES_SECTION_NOT_FOUND":
      return "References section not found";
    case "UNSUPPORTED_CITATION_STYLE":
      return "Style limitation";
  }
}

export default function CitationConsistencyPanel({
  documentText,
}: Props) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [privacy, setPrivacy] = useState<ApiResponse["privacy"]>();
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function analyze() {
    if (!documentText.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setError("");
    setResult(null);
    setPrivacy(undefined);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ manuscriptText: documentText }),
      });

      const body = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(
          body.error?.message ??
            `Citation analysis failed (HTTP ${response.status}).`,
        );
      }

      if (!body.result || !Array.isArray(body.result.findings)) {
        throw new Error("The API returned an invalid citation analysis result.");
      }

      setResult(body.result);
      setPrivacy(body.privacy);
    } catch (cause) {
      setError(
        cause instanceof TypeError
          ? "Could not reach the API. Confirm the API is running at 127.0.0.1:4000."
          : cause instanceof Error
            ? cause.message
            : "Citation consistency analysis could not be completed.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <section className="text-panel" aria-labelledby="citation-consistency-title">
      <div className="text-panel-heading">
        <div>
          <h3 id="citation-consistency-title">Citation consistency</h3>
          <p>
            Check supported numbered citations against your detected reference
            list.
          </p>
        </div>
        <button
          className="button button-secondary button-small"
          type="button"
          onClick={analyze}
          disabled={!documentText.trim() || isAnalyzing}
        >
          {isAnalyzing ? "Checking…" : result ? "Run again" : "Check citations"}
        </button>
      </div>

      <div style={{ padding: "18px" }}>
        <p style={{ color: "var(--muted, #68736c)", marginTop: 0 }}>
          This check runs only when you select the button. It looks for bracketed
          numeric citations such as [1] and [2, 3].
        </p>

        {error && (
          <div className="error-message" role="alert">
            <strong>Analysis could not be completed</strong>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div aria-live="polite">
            <div className="stats-grid">
              <div className="stat-card">
                <span>Unique in-text numbers</span>
                <strong>
                  {result.summary.uniqueInTextCitationCount.toLocaleString()}
                </strong>
              </div>
              <div className="stat-card">
                <span>Reference entries</span>
                <strong>
                  {result.summary.referenceEntryCount.toLocaleString()}
                </strong>
              </div>
              <div className="stat-card">
                <span>Matched numbers</span>
                <strong>{result.summary.matchedCount.toLocaleString()}</strong>
              </div>
              <div className="stat-card">
                <span>Missing references</span>
                <strong>
                  {result.summary.missingReferenceCount.toLocaleString()}
                </strong>
              </div>
              <div className="stat-card">
                <span>Uncited references</span>
                <strong>
                  {result.summary.uncitedReferenceCount.toLocaleString()}
                </strong>
              </div>
              <div className="stat-card">
                <span>Duplicate numbers</span>
                <strong>
                  {result.summary.duplicateReferenceCount.toLocaleString()}
                </strong>
              </div>
            </div>

            <div style={{ marginTop: "18px" }}>
              <h4 style={{ marginBottom: "8px" }}>Findings</h4>

              {result.findings.length === 0 ? (
                <p>No findings were returned by this analysis.</p>
              ) : (
                <ul style={{ paddingLeft: "22px" }}>
                  {result.findings.map((finding, index) => (
                    <li
                      key={`${finding.code}-${finding.citationNumber ?? "none"}-${index}`}
                      style={{ marginBottom: "12px" }}
                    >
                      <strong>
                        {findingLabel(finding.code)}
                        {finding.citationNumber !== undefined
                          ? ` [${finding.citationNumber}]`
                          : ""}
                      </strong>
                      <p style={{ margin: "4px 0" }}>{finding.message}</p>
                      <span
                        style={{
                          color: "var(--muted, #68736c)",
                          fontSize: "0.85rem",
                        }}
                      >
                        {finding.severity === "warning"
                          ? "Review recommended"
                          : "Information"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="notice" style={{ marginTop: "18px" }}>
              <strong>What this check cannot verify</strong>
              <ul style={{ paddingLeft: "22px", marginBottom: 0 }}>
                {result.limitations.map((limitation, index) => (
                  <li key={`${index}-${limitation}`}>{limitation}</li>
                ))}
              </ul>
            </div>

            {privacy && (
              <p
                className="privacy-note"
                style={{ marginTop: "14px" }}
                role="status"
              >
                Privacy: {privacy.persisted ? "data persistence reported" : "not persisted"};{" "}
                {privacy.externalServicesUsed
                  ? "external services used"
                  : "no external services used"}.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
