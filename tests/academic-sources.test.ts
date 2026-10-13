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

vi.mock("../apps/api/src/academic-sources.js", () => ({
  searchAcademicSources: vi.fn(),
}));

import { searchAcademicSources } from "../apps/api/src/academic-sources.js";
import app from "../apps/api/src/app.js";

const mockedSearch = vi.mocked(searchAcademicSources);

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

async function searchRequest(body: unknown) {
  return fetch(`${baseUrl}/api/academic-sources/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("Academic source search API", () => {
  beforeEach(() => {
    mockedSearch.mockReset();
  });

  it("returns academic source results and privacy metadata", async () => {
    mockedSearch.mockResolvedValue({
      query: "machine learning healthcare",
      totalResults: 42,
      returnedResults: 1,
      sources: [
        {
          title: "Machine Learning in Healthcare",
          authors: ["Example Author"],
          publicationYear: 2024,
          journal: "Example Journal",
          doi: "10.1234/example.2024",
          url: "https://doi.org/10.1234/example.2024",
          abstract: "An example abstract.",
          provider: "Crossref",
        },
      ],
      provider: "Crossref",
      limitations: ["Metadata may be incomplete."],
    });

    const response = await searchRequest({
      query: "machine learning healthcare",
      limit: 5,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockedSearch).toHaveBeenCalledWith(
      "machine learning healthcare",
      5,
    );
    expect(body.result.returnedResults).toBe(1);
    expect(body.result.sources[0].title).toBe(
      "Machine Learning in Healthcare",
    );
    expect(body.privacy).toEqual({
      persisted: false,
      storage: "memory_only",
      externalServicesUsed: true,
      externalProvider: "Crossref",
    });
  });

  it("rejects an empty search query", async () => {
    const response = await searchRequest({ query: "   " });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_ACADEMIC_SEARCH_REQUEST");
    expect(mockedSearch).not.toHaveBeenCalled();
  });

  it("rejects a query longer than 300 characters", async () => {
    const response = await searchRequest({
      query: "a".repeat(301),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_ACADEMIC_SEARCH_REQUEST");
    expect(mockedSearch).not.toHaveBeenCalled();
  });

  it("rejects a result limit outside the supported range", async () => {
    for (const limit of [0, 21, 1.5]) {
      const response = await searchRequest({
        query: "research methods",
        limit,
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("INVALID_ACADEMIC_SEARCH_REQUEST");
    }

    expect(mockedSearch).not.toHaveBeenCalled();
  });

  it("returns a gateway error when the provider is unavailable", async () => {
    mockedSearch.mockRejectedValue(
      new Error("Academic search is temporarily unreachable."),
    );

    const response = await searchRequest({
      query: "research methods",
    });
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error.code).toBe("ACADEMIC_SEARCH_UNAVAILABLE");
  });
});