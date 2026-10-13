
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer, type Server } from "node:http";

vi.mock("../apps/api/src/academic-sources.js", () => ({
  searchAcademicSources: vi.fn(),
}));

import { analyzeCitationConsistency } from "../apps/api/src/citation-consistency.js";
import app from "../apps/api/src/app.js";

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

beforeEach(() => {
  vi.clearAllMocks();
});

async function citationRequest(body: unknown) {
  return fetch(`${baseUrl}/api/citation-consistency/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("analyzeCitationConsistency", () => {
  it("matches numbered citations with reference entries", () => {
    const text = [
      "Introduction",
      "Prior studies support this approach [1].",
      "A second study confirms the trend [2, 3].",
      "",
      "References",
      "[1] Author One. First study.",
      "[2] Author Two. Second study.",
      "[3] Author Three. Third study.",
    ].join("\n");

    const result = analyzeCitationConsistency(text);

    expect(result.citationStyle).toBe("numbered");
    expect(result.inTextCitationNumbers).toEqual([1, 2, 3]);
    expect(result.referenceNumbers).toEqual([1, 2, 3]);
    expect(result.matchedNumbers).toEqual([1, 2, 3]);
    expect(result.summary.missingReferenceCount).toBe(0);
    expect(result.summary.uncitedReferenceCount).toBe(0);
    expect(result.summary.duplicateReferenceCount).toBe(0);
  });

  it("reports citations without matching reference entries", () => {
    const text = [
      "Discussion",
      "Earlier work supports this result [1, 4].",
      "",
      "References",
      "[1] Author One. First study.",
    ].join("\n");

    const result = analyzeCitationConsistency(text);

    expect(result.summary.missingReferenceCount).toBe(1);
    expect(
      result.findings.some(
        (finding) =>
          finding.code === "MISSING_REFERENCE" &&
          finding.citationNumber === 4,
      ),
    ).toBe(true);
  });

  it("reports reference entries that are not cited", () => {
    const text = [
      "Introduction",
      "The method was previously described [1].",
      "",
      "References",
      "[1] Author One. First study.",
      "[2] Author Two. Unused study.",
    ].join("\n");

    const result = analyzeCitationConsistency(text);

    expect(result.summary.uncitedReferenceCount).toBe(1);
    expect(
      result.findings.some(
        (finding) =>
          finding.code === "UNCITED_REFERENCE" &&
          finding.citationNumber === 2,
      ),
    ).toBe(true);
  });

  it("reports duplicate reference numbers", () => {
    const text = [
      "Results",
      "The first study is relevant [1].",
      "",
      "References",
      "[1] Author One. First study.",
      "[1] Author Two. Different study.",
    ].join("\n");

    const result = analyzeCitationConsistency(text);

    expect(result.summary.duplicateReferenceCount).toBe(1);
    expect(
      result.findings.some(
        (finding) =>
          finding.code === "DUPLICATE_REFERENCE" &&
          finding.citationNumber === 1,
      ),
    ).toBe(true);
  });

  it("supports numeric citations separated by semicolons", () => {
    const text = [
      "Background",
      "Previous findings [1; 2] are relevant.",
      "",
      "Bibliography",
      "[1] Author One. First study.",
      "[2] Author Two. Second study.",
    ].join("\n");

    const result = analyzeCitationConsistency(text);

    expect(result.inTextCitationNumbers).toEqual([1, 2]);
    expect(result.matchedNumbers).toEqual([1, 2]);
  });

  it("reports when a recognizable references heading is absent", () => {
    const result = analyzeCitationConsistency(
      "Introduction\nThis paper discusses earlier research [1].",
    );

    expect(result.citationStyle).toBe("unknown");
    expect(
      result.findings.some(
        (finding) => finding.code === "REFERENCES_SECTION_NOT_FOUND",
      ),
    ).toBe(true);
  });

  it("rejects empty manuscript text", () => {
    expect(() => analyzeCitationConsistency("   ")).toThrow(
      "Provide manuscript text to analyze.",
    );
  });

  it("rejects text exceeding the supported length", () => {
    expect(() =>
      analyzeCitationConsistency("a".repeat(200_001)),
    ).toThrow("Manuscript text must be");
  });

  it("states that source accuracy is not verified", () => {
    const result = analyzeCitationConsistency(
      [
        "Discussion",
        "This study supports the argument [1].",
        "",
        "References",
        "[1] Author One. Example publication.",
      ].join("\n"),
    );

    expect(
      result.limitations.some((limitation) =>
        limitation.includes("does not establish"),
      ),
    ).toBe(true);
  });
});

describe("Citation consistency API", () => {
  it("returns the analysis and memory-only privacy metadata", async () => {
    const response = await citationRequest({
      manuscriptText: [
        "Introduction",
        "Earlier research supports this approach [1].",
        "",
        "References",
        "[1] Author One. Example study.",
      ].join("\n"),
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.result.citationStyle).toBe("numbered");
    expect(body.result.matchedNumbers).toEqual([1]);
    expect(body.privacy).toEqual({
      persisted: false,
      storage: "memory_only",
      externalServicesUsed: false,
    });
  });

  it("rejects an empty manuscript", async () => {
    const response = await citationRequest({ manuscriptText: "   " });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe(
      "INVALID_CITATION_CONSISTENCY_REQUEST",
    );
  });

  it("rejects missing manuscript text", async () => {
    const response = await citationRequest({});
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe(
      "INVALID_CITATION_CONSISTENCY_REQUEST",
    );
  });

  it("rejects text exceeding the supported length", async () => {
    const response = await citationRequest({
      manuscriptText: "a".repeat(200_001),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe(
      "INVALID_CITATION_CONSISTENCY_REQUEST",
    );
  });

  it("does not call the academic metadata provider", async () => {
    const { searchAcademicSources } = await import(
      "../apps/api/src/academic-sources.js"
    );

    const response = await citationRequest({
      manuscriptText: [
        "Discussion",
        "A source is cited [1].",
        "",
        "References",
        "[1] Author One. Example study.",
      ].join("\n"),
    });

    expect(response.status).toBe(200);
    expect(searchAcademicSources).not.toHaveBeenCalled();
  });
});
