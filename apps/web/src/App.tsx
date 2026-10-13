
import { useRef, useState } from "react";
import { researchQuestionSchema } from "@paperpilot/shared";
import StructureAuditPanel from "./StructureAuditPanel";
import ResearchQualityPanel from "./ResearchQualityPanel";
import AcademicSourcesPanel from "./AcademicSourcesPanel";
import CitationConsistencyPanel from "./CitationConsistencyPanel";
import CitationStyleValidationPanel from "./CitationStyleValidationPanel";

const API_URL = "http://127.0.0.1:4000/api/documents/extract";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type ExtractionStatus =
  | "completed"
  | "no_extractable_text"
  | "empty_document";

type ExtractedDocument = {
  filename: string;
  format: "pdf" | "docx";
  sizeBytes: number;
  pageCount: number | null;
  characterCount: number;
  wordCount: number;
  extractionStatus: ExtractionStatus;
  text: string;
};

type ApiError = {
  error?: {
    code?: string;
    message?: string;
  };
};

type Stage = "document" | "question" | "review";

function validateFile(file: File): string | null {
  const extension = file.name.toLowerCase().split(".").pop();

  if (file.size === 0) {
    return "This file is empty. Choose another document.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "The file exceeds the 20 MiB upload limit.";
  }

  if (extension === "pdf" && file.type === PDF_MIME) {
    return null;
  }

  if (extension === "docx" && file.type === DOCX_MIME) {
    return null;
  }

  return "Choose a PDF or DOCX file with the correct file type.";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [document, setDocument] = useState<ExtractedDocument | null>(null);
  const [question, setQuestion] = useState("");
  const [stage, setStage] = useState<Stage>("document");
  const [error, setError] = useState("");
  const [questionError, setQuestionError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  function chooseFile(file: File | undefined) {
    if (!file) return;

    setDocument(null);
    setQuestion("");
    setQuestionError("");
    setStage("document");
    setError("");
    setCopied(false);

    const validationError = validateFile(file);

    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
  }

  async function extractDocument() {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setError("");
    setDocument(null);
    setQuestion("");
    setQuestionError("");
    setStage("document");
    setCopied(false);

    try {
      const form = new FormData();
      form.append("file", selectedFile);

      const response = await fetch(API_URL, {
        method: "POST",
        body: form,
      });

      const body = (await response.json()) as {
        document?: ExtractedDocument;
      } & ApiError;

      if (!response.ok) {
        throw new Error(
          body.error?.message ??
            `Extraction failed (HTTP ${response.status}).`,
        );
      }

      if (
        !body.document ||
        typeof body.document.text !== "string" ||
        ![
          "completed",
          "no_extractable_text",
          "empty_document",
        ].includes(body.document.extractionStatus)
      ) {
        throw new Error(
          "The server response did not contain a valid extraction result.",
        );
      }

      setDocument(body.document);
    } catch (cause) {
      setError(
        cause instanceof TypeError
          ? "Could not reach the API. Confirm the API is running at 127.0.0.1:4000 and reopen this page using 127.0.0.1:5173."
          : cause instanceof Error
            ? cause.message
            : "An unexpected error occurred.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function validateQuestion(): boolean {
    const result = researchQuestionSchema.safeParse({ question });

    if (!result.success) {
      setQuestionError(
        question.trim().length < 5
          ? "Enter a research question containing at least 5 characters."
          : "Your question must not exceed 1,000 characters.",
      );
      return false;
    }

    setQuestionError("");
    setQuestion(result.data.question);
    return true;
  }

  function continueToQuestion() {
    if (!document || document.extractionStatus !== "completed") return;
    if (!document.text.trim()) return;

    setError("");
    setQuestionError("");
    setStage("question");
  }

  function continueToReview() {
    if (!document || document.extractionStatus !== "completed") return;

    if (validateQuestion()) {
      setStage("review");
      setError("");
    }
  }

  async function copyText() {
    if (!document?.text) return;

    try {
      await navigator.clipboard.writeText(document.text);
      setCopied(true);
      setError("");
    } catch {
      setError(
        "Clipboard access was blocked. Select the extracted text and copy it manually.",
      );
    }
  }

  function resetWorkspace() {
    setSelectedFile(null);
    setDocument(null);
    setQuestion("");
    setQuestionError("");
    setError("");
    setCopied(false);
    setStage("document");

    if (inputRef.current) inputRef.current.value = "";
  }

  const hasUsableText =
    document?.extractionStatus === "completed" &&
    document.text.trim().length > 0;

  const questionValidation = researchQuestionSchema.safeParse({ question });
  const questionIsValid = questionValidation.success;

  const currentStep =
    stage === "document" ? "01" : stage === "question" ? "02" : "03";

  return (
    <main className="page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Paperpilot home">
          <span className="brand-mark">P</span>
          <span>Paperpilot</span>
        </a>

        <span className="status">
          <span className="status-dot" /> V2 · Development
        </span>
      </header>

      <section className="hero">
        <p className="eyebrow">YOUR RESEARCH WORKSPACE</p>
        <h1>
          Make your research
          <br />
          more rigorous.
        </h1>
        <p className="intro">
          Work on one manuscript at a time. Extract its text, audit its
          structure, review research-quality indicators, check citation
          consistency, discover academic sources, and define your research
          question.
        </p>
      </section>

      <section className="workspace" aria-labelledby="workspace-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              STEP {currentStep} ·{" "}
              {stage === "document"
                ? "DOCUMENT"
                : stage === "question"
                  ? "RESEARCH QUESTION"
                  : "REVIEW"}
            </p>

            <h2 id="workspace-heading">
              {stage === "document"
                ? document
                  ? "Review your manuscript"
                  : "Upload your manuscript"
                : stage === "question"
                  ? "Define your research question"
                  : "Review your manuscript analysis"}
            </h2>

            <p className="section-description">
              {stage === "document"
                ? "Choose a text-based PDF or DOCX document."
                : stage === "question"
                  ? "Enter one primary question for this manuscript."
                  : "Review the research-quality findings and your research question."}
            </p>
          </div>

          <span className="step-count">{currentStep} / 03</span>
        </div>

        {stage === "document" && !document && (
          <>
            <div
              className={`dropzone${isDragging ? " dropzone-active" : ""}${selectedFile ? " dropzone-selected" : ""}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                event.preventDefault();

                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  )
                ) {
                  setIsDragging(false);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                chooseFile(event.dataTransfer.files[0]);
              }}
            >
              <input
                ref={inputRef}
                className="file-input"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                aria-label="Choose a PDF or DOCX manuscript"
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />

              <div className="upload-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15.5v3A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {selectedFile ? (
                <>
                  <h3 className="drop-title">{selectedFile.name}</h3>
                  <p className="drop-description">
                    {formatBytes(selectedFile.size)} ·{" "}
                    {selectedFile.name.toLowerCase().endsWith(".pdf")
                      ? "PDF document"
                      : "Word document"}
                  </p>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => inputRef.current?.click()}
                  >
                    Choose a different file
                  </button>
                </>
              ) : (
                <>
                  <h3 className="drop-title">Drop your manuscript here</h3>
                  <p className="drop-description">
                    or browse files from your computer
                  </p>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => inputRef.current?.click()}
                  >
                    Browse files
                  </button>
                </>
              )}

              <p className="file-guidance">PDF or DOCX · Maximum 20 MiB</p>
            </div>

            <div className="upload-actions">
              <p className="privacy-note">
                <span aria-hidden="true">⌑</span> Processed in memory; this
                endpoint does not save your file.
              </p>

              <button
                className="button button-primary"
                type="button"
                disabled={!selectedFile || isUploading}
                onClick={extractDocument}
              >
                {isUploading ? (
                  <>
                    <span className="spinner" /> Extracting text…
                  </>
                ) : (
                  <>
                    Extract text <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="error-message" role="alert">
            <strong>Something needs attention</strong>
            <p>{error}</p>
          </div>
        )}

        {document && stage === "document" && (
          <div className="results" aria-live="polite">
            <div className="result-banner">
              <span className="success-icon" aria-hidden="true">
                {hasUsableText ? "✓" : "!"}
              </span>

              <div className="result-banner-copy">
                <strong>
                  {document.extractionStatus === "completed"
                    ? "Text extraction complete"
                    : document.extractionStatus === "no_extractable_text"
                      ? "No extractable text found"
                      : "Document contains no text"}
                </strong>
                <span>{document.filename}</span>
              </div>

              <button
                className="text-button reset-button"
                type="button"
                onClick={resetWorkspace}
              >
                New document
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span>Word count</span>
                <strong>{document.wordCount.toLocaleString()}</strong>
              </div>

              <div className="stat-card">
                <span>Characters</span>
                <strong>{document.characterCount.toLocaleString()}</strong>
              </div>

              <div className="stat-card">
                <span>File size</span>
                <strong>{formatBytes(document.sizeBytes)}</strong>
              </div>

              <div className="stat-card">
                <span>Pages</span>
                <strong>
                  {document.pageCount === null
                    ? "—"
                    : document.pageCount.toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="text-panel">
              <div className="text-panel-heading">
                <div>
                  <h3>Extracted text</h3>
                  <p>Content returned by the document extraction API</p>
                </div>

                <button
                  className="button button-secondary button-small"
                  type="button"
                  onClick={copyText}
                  disabled={!document.text}
                >
                  {copied ? "Copied" : "Copy text"}
                </button>
              </div>

              <pre className="extracted-text">
                {document.text ||
                  "No text could be extracted from this document. Scanned PDFs may require OCR, which is not implemented yet."}
              </pre>
            </div>

            {hasUsableText && (
              <>
                <StructureAuditPanel documentText={document.text} />

                <ResearchQualityPanel
                  documentText={document.text}
                  filename={document.filename}
                />

                <AcademicSourcesPanel />

                <CitationConsistencyPanel documentText={document.text} />
                <CitationStyleValidationPanel documentText={document.text} />
              </>
            )}

            <div className="notice">
              <strong>Current analysis capabilities</strong>
              <p>
                Structure auditing checks recognizable section headings.
                Research-quality review checks selected text indicators.
                Academic source discovery retrieves publication metadata from
                Crossref. Citation consistency checks supported numbered
                citation patterns against detected reference entries. These
                features do not prove scientific correctness. Plagiarism
                detection, AI-content detection, novelty assessment, citation
                accuracy, and research-readiness scores are not implemented.
              </p>
            </div>

            <div className="result-footer">
              <span>
                Privacy: document extraction and citation analysis use
                memory-only processing. Academic search sends your query to
                Crossref.
              </span>

              {hasUsableText ? (
                <button
                  className="button button-primary"
                  type="button"
                  onClick={continueToQuestion}
                >
                  Continue to research question{" "}
                  <span aria-hidden="true">→</span>
                </button>
              ) : (
                <button
                  className="button button-primary"
                  type="button"
                  onClick={resetWorkspace}
                >
                  Choose another document
                </button>
              )}
            </div>
          </div>
        )}

        {document && stage === "question" && (
          <div className="results">
            <div className="result-banner">
              <span className="success-icon" aria-hidden="true">
                ✓
              </span>

              <div className="result-banner-copy">
                <strong>Manuscript extracted</strong>
                <span>{document.filename}</span>
              </div>

              <button
                className="text-button reset-button"
                type="button"
                onClick={() => setStage("document")}
              >
                Back to document
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span>Words</span>
                <strong>{document.wordCount.toLocaleString()}</strong>
              </div>

              <div className="stat-card">
                <span>Characters</span>
                <strong>{document.characterCount.toLocaleString()}</strong>
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                continueToReview();
              }}
              className="text-panel"
            >
              <div className="text-panel-heading">
                <div>
                  <h3>Primary research question</h3>
                  <p>
                    Use one clear question that describes what your research
                    is trying to investigate.
                  </p>
                </div>
              </div>

              <div style={{ padding: "18px" }}>
                <label
                  htmlFor="research-question"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "8px",
                  }}
                >
                  Your research question
                </label>

                <textarea
                  id="research-question"
                  name="researchQuestion"
                  value={question}
                  onChange={(event) => {
                    setQuestion(event.target.value);
                    setQuestionError("");
                  }}
                  placeholder="Example: How does machine learning improve the early detection of diabetic retinopathy?"
                  rows={5}
                  maxLength={1000}
                  required
                  aria-invalid={Boolean(questionError)}
                  aria-describedby="question-help question-count"
                  style={{
                    display: "block",
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "14px",
                    border: questionError
                      ? "1px solid #c2413b"
                      : "1px solid var(--border, #d9dedb)",
                    borderRadius: "10px",
                    background: "var(--surface, #ffffff)",
                    color: "var(--text, #202923)",
                    font: "inherit",
                    resize: "vertical",
                    minHeight: "120px",
                  }}
                />

                <div
                  id="question-help"
                  style={{
                    marginTop: "8px",
                    color: "var(--muted, #68736c)",
                  }}
                >
                  Enter between 5 and 1,000 characters. One question per
                  manuscript.
                </div>

                <div
                  id="question-count"
                  style={{
                    marginTop: "6px",
                    textAlign: "right",
                    color: "var(--muted, #68736c)",
                    fontSize: "0.875rem",
                  }}
                >
                  {question.length.toLocaleString()} / 1,000
                </div>

                {questionError && (
                  <p
                    id="question-error"
                    role="alert"
                    style={{ color: "#b42318" }}
                  >
                    {questionError}
                  </p>
                )}

                <div className="notice" style={{ marginTop: "20px" }}>
                  <strong>Why we ask this</strong>
                  <p>
                    The question helps define the scope of future research
                    checks. Entering it does not run question-specific analysis
                    or generate scores. The manuscript review above is a
                    separate text-based heuristic.
                  </p>
                </div>

                <div className="result-footer" style={{ marginTop: "20px" }}>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => setStage("document")}
                  >
                    Back
                  </button>

                  <button
                    className="button button-primary"
                    type="submit"
                    disabled={!question.trim() || !questionIsValid}
                  >
                    Review request <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {document && stage === "review" && (
          <div className="results" aria-live="polite">
            <div className="result-banner">
              <span className="success-icon" aria-hidden="true">
                ✓
              </span>

              <div className="result-banner-copy">
                <strong>Request details validated</strong>
                <span>
                  The manuscript review ran separately in the document step.
                </span>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span>Manuscript</span>
                <strong style={{ overflowWrap: "anywhere" }}>
                  {document.filename}
                </strong>
              </div>

              <div className="stat-card">
                <span>Extracted words</span>
                <strong>{document.wordCount.toLocaleString()}</strong>
              </div>
            </div>

            <div className="text-panel">
              <div className="text-panel-heading">
                <div>
                  <h3>Your primary research question</h3>
                  <p>
                    Review this question before the next development stage.
                  </p>
                </div>
              </div>

              <div style={{ padding: "18px" }}>
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {question}
                </p>

                <button
                  className="button button-secondary button-small"
                  type="button"
                  onClick={() => setStage("question")}
                >
                  Edit question
                </button>
              </div>
            </div>

            <div className="notice">
              <strong>What has actually been checked</strong>
              <p>
                The Research Quality Review uses deterministic text heuristics
                and the Structure Audit checks recognizable section headings.
                Citation consistency checks numbered citation matching only.
                None of these validates scientific conclusions, detects
                plagiarism, or proves novelty. Academic source discovery is a
                separate Crossref metadata search. No account or database
                persistence is provided by these features.
              </p>
            </div>

            <div className="result-footer">
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setStage("document")}
              >
                Review manuscript
              </button>

              <button
                className="button button-primary"
                type="button"
                onClick={resetWorkspace}
              >
                Finish and start another paper{" "}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        )}
      </section>

      <footer className="footer">
        <span>Paperpilot · Research with evidence.</span>
        <span>
          Development preview · Heuristic findings require human interpretation.
        </span>
      </footer>
    </main>
  );
}
