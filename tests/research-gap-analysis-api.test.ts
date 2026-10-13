
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createServer, type Server } from "node:http";

vi.mock("../apps/api/src/research-gap-analysis.js", () => ({
  analyzeResearchGaps: vi.fn(),
}));

import { analyzeResearchGaps } from "../apps/api/src/research-gap-analysis.js";
import app from "../apps/api/src/app.js";

const mockedAnalyze = vi.mocked(analyzeResearchGaps);

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Could not determine the API test server port.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  if (server?.listening) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

async function analysisRequest(body: unknown) {
  return fetch(`${baseUrl}/api/research-gaps/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("Research gap analysis API", () => {
  beforeEach(() => {
    mockedAnalyze.mockReset();
  });

  it("returns candidates and privacy metadata", async () => {
    mockedAnalyze.mockReturnValue({
      reportType: "research_gap_analysis",
      method: "deterministic_manuscript_heuristics",
      verification: "not_verified_against_literature",
      candidates: [
        {
          id: "gap-1",
          type: "future_research",
          title: "Potential gap suggested by future research",
          evidence: "Future research should test additional datasets.",
          explanation: "This is a candidate, not a verified research gap.",
          recommendation: "Review relevant recent literature.",
          verificationStatus: "requires_literature_review",
        },
      ],
      summary: {
        candidateCount: 1,
        statedLimitations: 0,
        futureResearchItems: 1,
        unansweredQuestions: 0,
        missingEvidenceIndicators: 0,
      },
      limitations: [
        "No external literature search or full-text review is performed by this engine.",
      ],
    });

    const response = await analysisRequest({
      documentText:
        "Future research should test additional datasets.",
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockedAnalyze).toHaveBeenCalledWith(
      "Future research should test additional datasets.",
    );
    expect(body.report.candidates).toHaveLength(1);
    expect(body.report.verification).toBe(
      "not_verified_against_literature",
    );
    expect(body.privacy).toEqual({
      persisted: false,
      storage: "memory_only",
      externalServicesUsed: false,
    });
  });

  it("rejects empty manuscript text", async () => {
    const response = await analysisRequest({ documentText: "   " });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe(
      "INVALID_RESEARCH_GAP_ANALYSIS_REQUEST",
    );
    expect(mockedAnalyze).not.toHaveBeenCalled();
  });

  it("rejects missing manuscript text", async () => {
    const response = await analysisRequest({});
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe(
      "INVALID_RESEARCH_GAP_ANALYSIS_REQUEST",
    );
    expect(mockedAnalyze).not.toHaveBeenCalled();
  });

  it("rejects manuscript text exceeding the size limit", async () => {
    const response = await analysisRequest({
      documentText: "a".repeat(2_000_001),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe(
      "INVALID_RESEARCH_GAP_ANALYSIS_REQUEST",
    );
    expect(mockedAnalyze).not.toHaveBeenCalled();
  });
});
