
export type AcademicSource = {
  title: string;
  authors: string[];
  publicationYear: number | null;
  journal: string | null;
  doi: string | null;
  url: string;
  abstract: string | null;
  provider: "Crossref";
};

export type AcademicSourceSearchResult = {
  query: string;
  totalResults: number;
  returnedResults: number;
  sources: AcademicSource[];
  provider: "Crossref";
  limitations: string[];
};

type CrossrefWork = {
  title?: string[];
  author?: Array<{
    given?: string;
    family?: string;
    name?: string;
  }>;
  published?: {
    "date-parts"?: number[][];
  };
  "published-print"?: {
    "date-parts"?: number[][];
  };
  "published-online"?: {
    "date-parts"?: number[][];
  };
  "container-title"?: string[];
  DOI?: string;
  URL?: string;
  abstract?: string;
  type?: string;
};

type CrossrefResponse = {
  status?: string;
  message?: {
    "total-results"?: number;
    items?: CrossrefWork[];
  };
};

const CROSSREF_ENDPOINT = "https://api.crossref.org/works";
const MAX_QUERY_LENGTH = 300;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;
const REQUEST_TIMEOUT_MS = 10_000;

function cleanText(value: string): string {
  return value
    .replace(/<[^>]*>/gu, " ")
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&quot;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/\s+/gu, " ")
    .trim();
}

function getPublicationYear(
  work: CrossrefWork,
): number | null {
  const dateGroups = [
    work.published?.["date-parts"]?.[0],
    work["published-print"]?.["date-parts"]?.[0],
    work["published-online"]?.["date-parts"]?.[0],
  ];

  for (const dateParts of dateGroups) {
    const year = dateParts?.[0];

    if (
      typeof year === "number" &&
      Number.isInteger(year) &&
      year >= 1000 &&
      year <= 9999
    ) {
      return year;
    }
  }

  return null;
}

function mapWork(work: CrossrefWork): AcademicSource | null {
  const title = cleanText(work.title?.[0] ?? "");

  if (!title) {
    return null;
  }

  const authors = (work.author ?? [])
    .map((author) => {
      const fullName = [author.given, author.family]
        .filter(
          (part): part is string =>
            typeof part === "string" && part.trim().length > 0,
        )
        .join(" ")
        .trim();

      return fullName || author.name?.trim() || "";
    })
    .filter(Boolean)
    .slice(0, 30);

  const doi = work.DOI?.trim() || null;
  const url = doi
    ? `https://doi.org/${encodeURIComponent(doi)}`
    : work.URL?.startsWith("https://")
      ? work.URL
      : null;

  if (!url) {
    return null;
  }

  const rawAbstract = work.abstract
    ? cleanText(work.abstract)
    : "";

  return {
    title,
    authors,
    publicationYear: getPublicationYear(work),
    journal: cleanText(work["container-title"]?.[0] ?? "") || null,
    doi,
    url,
    abstract: rawAbstract || null,
    provider: "Crossref",
  };
}

export async function searchAcademicSources(
  query: string,
  requestedLimit = DEFAULT_LIMIT,
): Promise<AcademicSourceSearchResult> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    throw new Error("Enter a research topic or search query.");
  }

  if (normalizedQuery.length > MAX_QUERY_LENGTH) {
    throw new Error(
      `Search queries must be ${MAX_QUERY_LENGTH} characters or fewer.`,
    );
  }

  if (
    !Number.isInteger(requestedLimit) ||
    requestedLimit < 1 ||
    requestedLimit > MAX_LIMIT
  ) {
    throw new Error(
      `The result limit must be an integer between 1 and ${MAX_LIMIT}.`,
    );
  }

  const url = new URL(CROSSREF_ENDPOINT);
  url.searchParams.set("query", normalizedQuery);
  url.searchParams.set("rows", String(requestedLimit));
  url.searchParams.set("select", [
    "title",
    "author",
    "published",
    "published-print",
    "published-online",
    "container-title",
    "DOI",
    "URL",
    "abstract",
    "type",
  ].join(","));

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new Error(
      "Academic search is temporarily unreachable. Check your internet connection and try again.",
    );
  }

  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? "Academic search is busy. Please wait and try again."
        : "The academic metadata provider could not complete the search. Try again later.",
    );
  }

  let payload: CrossrefResponse;

  try {
    payload = (await response.json()) as CrossrefResponse;
  } catch {
    throw new Error(
      "The academic metadata provider returned an invalid response.",
    );
  }

  if (!Array.isArray(payload.message?.items)) {
    throw new Error(
      "The academic metadata provider returned an unexpected response format.",
    );
  }

  const sources = payload.message.items
    .map(mapWork)
    .filter(
      (source): source is AcademicSource => source !== null,
    );

  return {
    query: normalizedQuery,
    totalResults: Math.max(
      0,
      payload.message["total-results"] ?? sources.length,
    ),
    returnedResults: sources.length,
    sources,
    provider: "Crossref",
    limitations: [
      "Results contain publication metadata supplied by Crossref and may be incomplete or inaccurate.",
      "An abstract is shown only when the provider supplies one.",
      "A DOI or publication link does not guarantee free full-text access.",
      "Search results do not establish that a paper supports a particular research claim.",
      "This service does not assess plagiarism, novelty, peer-review quality, or scientific validity.",
    ],
  };
}
