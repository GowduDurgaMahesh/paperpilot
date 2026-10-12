
import { useState } from "react";

const API_URL = "http://127.0.0.1:4000/api/documents/audit-structure";

type StructureCheck = {
  id: string;
  label: string;
  status: "detected" | "not_detected";
  matchedHeading: string | null;
  explanation: string;
};

type StructureAudit = {
  auditType: "document_structure";
  method: "heading_detection";
  checks: StructureCheck[];
  detectedCount: number;
  notDetectedCount: number;
  limitations: string[];
};

type AuditResponse = {
  audit?: StructureAudit;
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

export default function StructureAuditPanel({ documentText }: Props) {
  const [result, setResult] = useState<StructureAudit | null>(null);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  async function runAudit() {
    if (isRunning) return;

    if (!documentText.trim()) {
      setError("No extracted text is available to audit.");
      return;
    }

    setIsRunning(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentText }),
      });

      const body = (await response.json()) as AuditResponse;

      if (!response.ok) {
        throw new Error(
          body.error?.message ??
            `Structure audit failed (HTTP ${response.status}).`,
        );
      }

      if (
        !body.audit ||
        body.audit.auditType !== "document_structure" ||
        !Array.isArray(body.audit.checks) ||
        !Array.isArray(body.audit.limitations) ||
        typeof body.audit.detectedCount !== "number" ||
        typeof body.audit.notDetectedCount !== "number"
      ) {
        throw new Error("The server returned an invalid structure-audit result.");
      }

      setResult(body.audit);
    } catch (cause) {
      setError(
        cause instanceof TypeError
          ? "Could not reach the API. Make sure the API is running at 127.0.0.1:4000."
          : cause instanceof Error
            ? cause.message
            : "An unexpected error occurred while auditing the document.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <section
      className="text-panel"
      aria-labelledby="structure-audit-heading"
      style={{ marginTop: "20px" }}
    >
      <div className="text-panel-heading">
        <div>
          <h3 id="structure-audit-heading">Document structure audit</h3>
          <p>
            Check for nine recognizable research-paper section headings.
            This is a structural check, not a scientific-quality assessment.
          </p>
        </div>
      </div>

      <button
        className="button button-primary"
        type="button"
        onClick={runAudit}
        disabled={isRunning || !documentText.trim()}
      >
        {isRunning ? (
          <>
            <span className="spinner" /> Auditing structure…
          </>
        ) : (
          "Run structure audit"
        )}
      </button>

      {error && (
        <div className="error-message" role="alert" style={{ marginTop: "16px" }}>
          <strong>Audit could not be completed</strong>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div aria-live="polite" style={{ marginTop: "20px" }}>
          <div className="stats-grid">
            <div className="stat-card">
              <span>Headings detected</span>
              <strong>{result.detectedCount} / {result.checks.length}</strong>
            </div>
            <div className="stat-card">
              <span>Not recognized</span>
              <strong>{result.notDetectedCount}</strong>
            </div>
          </div>

          <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
            {result.checks.map((check) => (
              <article
                key={check.id}
                style={{
                  border: "1px solid var(--border, #d9dedb)",
                  borderRadius: "10px",
                  padding: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <strong>{check.label}</strong>
                  <span
                    style={{
                      color:
                        check.status === "detected" ? "#18794e" : "#8a5a00",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                    }}
                  >
                    {check.status === "detected"
                      ? "Heading detected"
                      : "Not recognized"}
                  </span>
                </div>

                {check.matchedHeading && (
                  <p style={{ margin: "8px 0", overflowWrap: "anywhere" }}>
                    <span style={{ color: "var(--muted, #68736c)" }}>
                      Matched heading:{" "}
                    </span>
                    {check.matchedHeading}
                  </p>
                )}

                <p style={{ margin: "8px 0 0", color: "var(--muted, #68736c)" }}>
                  {check.explanation}
                </p>
              </article>
            ))}
          </div>

          <div className="notice" style={{ marginTop: "20px" }}>
            <strong>Understand these results</strong>
            <p>
              A detected heading does not prove that its section is complete
              or scientifically adequate. A heading that is not recognized
              may still be present under different wording or formatting.
            </p>
            <ul>
              {result.limitations.map((limitation, index) => (
                <li key={index}>{limitation}</li>
              ))}
            </ul>
          </div>

          <p
            style={{
              color: "var(--muted, #68736c)",
              fontSize: "0.875rem",
              marginTop: "12px",
            }}
          >
            This audit does not generate plagiarism, novelty, citation-accuracy,
            AI-content, or research-readiness scores.
          </p>
        </div>
      )}
    </section>
  );
}
