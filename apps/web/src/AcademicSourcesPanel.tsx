import { useState, type FormEvent } from "react";

const API_URL = "http://127.0.0.1:4000/api/academic-sources/search";

type AcademicSource = {
  title: string;
  authors: string[];
  publicationYear: number | null;
  journal: string | null;
  doi: string | null;
  url: string;
  abstract: string | null;
  provider: "Crossref";
};

type SearchResult = {
  query: string;
  totalResults: number;
  returnedResults: number;
  sources: AcademicSource[];
  provider: "Crossref";
  limitations: string[];
};

type SearchResponse = {
  result?: SearchResult;
  privacy?: {
    persisted: boolean;
    storage: string;
    externalServicesUsed: boolean;
    externalProvider: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
};

export default function AcademicSourcesPanel() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [privacyNotice, setPrivacyNotice] =
    useState<SearchResponse["privacy"]>(undefined);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  async function searchSources(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuery = query.trim();

    if (normalizedQuery.length === 0) {
      setError("Enter a research topic to search academic publications.");
      return;
    }

    if (normalizedQuery.length > 300) {
      setError("Your search must be 300 characters or fewer.");
      return;
    }

    setIsSearching(true);
    setError("");
    setResult(null);
    setPrivacyNotice(undefined);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: normalizedQuery,
          limit: 10,
        }),
      });

      const body = (await response.json()) as SearchResponse;

      if (!response.ok) {
        throw new Error(
          body.error?.message ??
            `Academic search failed (HTTP ${response.status}).`,
        );
      }

      if (
        !body.result ||
        !Array.isArray(body.result.sources) ||
        !Array.isArray(body.result.limitations)
      ) {
        throw new Error(
          "The academic search API returned an invalid response.",
        );
      }

      setResult(body.result);
      setPrivacyNotice(body.privacy);
    } catch (cause) {
      setError(
        cause instanceof TypeError
          ? "Could not reach the API. Confirm the Paperpilot API is running at 127.0.0.1:4000."
          : cause instanceof Error
            ? cause.message
            : "Academic search could not be completed.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <section
      className="text-panel"
      aria-labelledby="academic-sources-heading"
    >
      <div className="text-panel-heading">
        <div>
          <h3 id="academic-sources-heading">
            Academic source discovery
          </h3>
          <p>
            Search publication metadata from Crossref using your research
            topic.
          </p>
        </div>
      </div>

      <div style={{ padding: "18px" }}>
        <form onSubmit={searchSources}>
          <label
            htmlFor="academic-source-query"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              fontSize: "13px",
            }}
          >
            Research topic or keywords
          </label>

          <input
            id="academic-source-query"
            name="query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. machine learning for early disease detection"
            maxLength={300}
            required
            aria-describedby="academic-source-help"
            style={{
              display: "block",
              width: "100%",
              minHeight: "45px",
              padding: "12px",
              border: "1px solid var(--border, #dce5dc)",
              borderRadius: "9px",
              background: "#fff",
              color: "inherit",
              font: "inherit",
            }}
          />

          <div
            id="academic-source-help"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              marginTop: "7px",
              color: "var(--muted, #59655e)",
              fontSize: "11px",
            }}
          >
            <span>Up to 300 characters · Up to 10 results</span>
            <span>{query.length}/300</span>
          </div>

          <button
            className="button button-primary"
            type="submit"
            disabled={isSearching || !query.trim()}
            style={{ marginTop: "15px" }}
          >
            {isSearching ? (
              <>
                <span className="spinner" />
                Searching publications…
              </>
            ) : (
              <>
                Search academic sources
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div
            className="error-message"
            role="alert"
            style={{ marginTop: "16px" }}
          >
            <strong>Search could not be completed</strong>
            <p>{error}</p>
          </div>
        )}

        {result && (
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
                  {result.returnedResults} result
                  {result.returnedResults === 1 ? "" : "s"} returned
                </strong>
                <span>
                  Crossref reports {result.totalResults.toLocaleString()}{" "}
                  matching records for “{result.query}”.
                </span>
              </div>
            </div>

            {result.sources.length === 0 ? (
              <div className="notice">
                <strong>No displayable publications found</strong>
                <p>
                  Try different keywords. This search only displays records
                  with a usable publication title and link.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {result.sources.map((source, index) => (
                  <article
                    key={`${source.doi ?? source.url}-${index}`}
                    style={{
                      padding: "17px",
                      border: "1px solid #e0e7df",
                      borderRadius: "11px",
                      background: "#fff",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 8px",
                        color: "var(--green-light, #34704e)",
                        fontSize: "10px",
                        fontWeight: 800,
                        letterSpacing: "1.2px",
                        textTransform: "uppercase",
                      }}
                    >
                      Publication {index + 1} · Crossref metadata
                    </p>

                    <h4
                      style={{
                        margin: "0 0 10px",
                        fontSize: "16px",
                        lineHeight: 1.5,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {source.title}
                    </h4>

                    <p
                      style={{
                        margin: "0 0 7px",
                        color: "var(--muted, #59655e)",
                        fontSize: "12px",
                        lineHeight: 1.7,
                        overflowWrap: "anywhere",
                      }}
                    >
                      <strong>Authors:</strong>{" "}
                      {source.authors.length > 0
                        ? source.authors.join(", ")
                        : "Not supplied"}
                    </p>

                    <p
                      style={{
                        margin: "0 0 12px",
                        color: "var(--muted, #59655e)",
                        fontSize: "12px",
                        lineHeight: 1.7,
                      }}
                    >
                      {source.journal && (
                        <>
                          <strong>Publication:</strong> {source.journal}
                        </>
                      )}
                      {source.journal && source.publicationYear !== null
                        ? " · "
                        : ""}
                      {source.publicationYear !== null && (
                        <>
                          <strong>Year:</strong> {source.publicationYear}
                        </>
                      )}
                      {!source.journal &&
                        source.publicationYear === null &&
                        "Journal and publication year not supplied"}
                    </p>

                    {source.abstract ? (
                      <details style={{ marginBottom: "13px" }}>
                        <summary
                          style={{
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          View available abstract
                        </summary>
                        <p
                          style={{
                            color: "var(--muted, #59655e)",
                            fontSize: "12px",
                            lineHeight: 1.8,
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {source.abstract}
                        </p>
                      </details>
                    ) : (
                      <p
                        style={{
                          margin: "0 0 13px",
                          color: "var(--muted, #59655e)",
                          fontSize: "11px",
                        }}
                      >
                        No abstract was supplied by the provider.
                      </p>
                    )}

                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        color: "var(--green-light, #34704e)",
                        fontSize: "12px",
                        fontWeight: 700,
                        overflowWrap: "anywhere",
                      }}
                    >
                      Open publication record ↗
                    </a>

                    {source.doi && (
                      <p
                        style={{
                          margin: "9px 0 0",
                          color: "var(--muted, #59655e)",
                          fontSize: "11px",
                          overflowWrap: "anywhere",
                        }}
                      >
                        DOI: {source.doi}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}

            <div className="notice">
              <strong>Interpret results carefully</strong>
              <ul
                style={{
                  margin: "8px 0 0",
                  paddingLeft: "20px",
                  color: "var(--muted, #59655e)",
                  fontSize: "12px",
                  lineHeight: 1.8,
                }}
              >
                {result.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>

            {privacyNotice && (
              <p
                style={{
                  margin: 0,
                  color: "var(--muted, #59655e)",
                  fontSize: "11px",
                  lineHeight: 1.7,
                }}
              >
                Privacy:{" "}
                {privacyNotice.persisted
                  ? "The API reports that data may be persisted."
                  : "This search result is not persisted by the API."}{" "}
                External provider: {privacyNotice.externalProvider}.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}