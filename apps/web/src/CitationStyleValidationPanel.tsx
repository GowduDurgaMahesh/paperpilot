
import { useState } from "react";

const API_URL =
  "http://127.0.0.1:4000/api/citation-style-validation/analyze";

type Finding = {
  code: string;
  severity: "warning" | "info";
  referenceNumber?: number;
  message: string;
  correction: string;
};

type ValidationResult = {
  selectedStyle: "numbered";
  detectedReferenceCount: number;
  findings: Finding[];
  summary: {
    warningCount: number;
    informationCount: number;
    malformedReferenceCount: number;
    numberingGapCount: number;
    duplicateNumberCount: number;
  };
  limitations: string[];
};

type ApiResponse = {
  result?: ValidationResult;
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

function labelFor(code: string): string {
  const labels: Record<string, string> = {
    REFERENCE_SECTION_NOT_FOUND: "Reference section not found",
    MALFORMED_REFERENCE: "Malformed reference",
    NUMBERING_GAP: "Numbering gap",
    DUPLICATE_REFERENCE_NUMBER: "Duplicate reference number",
    MISSING_AUTHOR: "Possible missing author",
    MISSING_TITLE: "Possible missing title",
    MISSING_PUBLICATION_DETAILS: "Possible missing publication details",
    INCONSISTENT_FORMATTING: "Formatting inconsistency",
  };

  return labels[code] ?? "Validation finding";
}

export default function CitationStyleValidationPanel({
  documentText,
}: Props) {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [privacy, setPrivacy] = useState<ApiResponse["privacy"]>();
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  async function validate() {
    if (!documentText.trim() || isValidating) return;

    setIsValidating(true);
    setError("");
    setResult(null);
    setPrivacy(undefined);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          manuscriptText: documentText,
          selectedStyle: "numbered",
        }),
      });

      const body = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(
          body.error?.message ??
            `Citation formatting validation failed (HTTP ${response.status}).`,
        );
      }

      if (!body.result || !Array.isArray(body.result.findings)) {
        throw new Error("The API returned an invalid validation result.");
      }

      setResult(body.result);
      setPrivacy(body.privacy);
    } catch (cause) {
      setError(
        cause instanceof TypeError
          ? "Could not reach the API. Confirm the API is running at 127.0.0.1:4000."
          : cause instanceof Error
            ? cause.message
            : "Citation formatting validation could not be completed.",
      );
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <section
      className="text-panel"
      aria-labelledby="citation-style-validation-title"
    >
      <div className="text-panel-heading">
        <div>
          <h3 id="citation-style-validation-title">
            Citation style &amp; formatting
          </h3>
          <p>
            Review numbered reference structure, numbering gaps, duplicate
            entries, and potentially missing bibliographic details.
          </p>
        </div>

        <button
          className="button button-secondary button-small"
          type="button"
          onClick={validate}
          disabled={!documentText.trim() || isValidating}
        >
          {isValidating
            ? "Validating…"
            : result
              ? "Run again"
              : "Validate format"}
        </button>
      </div>

      <div style={{ padding: "18px" }}>
        <p style={{ color: "var(--muted, #68736c)", marginTop: 0 }}>
          This is a heuristic check of numbered references, not a certification
          of full IEEE or APA compliance. Review each suggestion against the
          original publication.
        </p>

        {error && (
          <div className="error-message" role="alert">
            <strong>Validation could not be completed</strong>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div aria-live="polite">
            <div className="stats-grid">
              <div className="stat-card">
                <span>Detected entries</span>
                <strong>{result.detectedReferenceCount}</strong>
              </div>
              <div className="stat-card">
                <span>Warnings</span>
                <strong>{result.summary.warningCount}</strong>
              </div>
              <div className="stat-card">
                <span>Information</span>
                <strong>{result.summary.informationCount}</strong>
              </div>
              <div className="stat-card">
                <span>Numbering gaps</span>
                <strong>{result.summary.numberingGapCount}</strong>
              </div>
              <div className="stat-card">
                <span>Duplicate numbers</span>
                <strong>{result.summary.duplicateNumberCount}</strong>
              </div>
              <div className="stat-card">
                <span>Malformed entries</span>
                <strong>{result.summary.malformedReferenceCount}</strong>
              </div>
            </div>

            <h4 style={{ marginBottom: "8px", marginTop: "20px" }}>
              Findings and suggested corrections
            </h4>

            {result.findings.length === 0 ? (
              <p>No issues were detected by the supported checks.</p>
            ) : (
              <ul style={{ paddingLeft: "22px" }}>
                {result.findings.map((finding, index) => (
                  <li
                    key={`${finding.code}-${finding.referenceNumber ?? "none"}-${index}`}
                    style={{ marginBottom: "14px" }}
                  >
                    <strong>
                      {labelFor(finding.code)}
                      {finding.referenceNumber !== undefined
                        ? ` [${finding.referenceNumber}]`
                        : ""}
                    </strong>
                    <p style={{ margin: "4px 0" }}>{finding.message}</p>
                    <p style={{ margin: "4px 0" }}>
                      <strong>Suggested action:</strong> {finding.correction}
                    </p>
                    <span
                      style={{
                        color: "var(--muted, #68736c)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {finding.severity === "warning"
                        ? "Review recommended"
                        : "Informational"}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="notice" style={{ marginTop: "18px" }}>
              <strong>Limitations</strong>
              <ul style={{ paddingLeft: "22px", marginBottom: 0 }}>
                {result.limitations.map((limitation, index) => (
                  <li key={`${index}-${limitation}`}>{limitation}</li>
                ))}
              </ul>
            </div>

            {privacy && (
              <p className="privacy-note" role="status">
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
