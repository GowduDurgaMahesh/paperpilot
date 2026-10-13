
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
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

async function validationRequest(body: unknown) {
  return fetch(`${baseUrl}/api/citation-style-validation/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("Citation style validation API", () => {
  it("returns findings and memory-only privacy metadata", async () => {
    const response = await validationRequest({
      manuscriptText: [
        "Introduction",
        "Earlier research supports this approach [1].",
        "",
        "References",
        "[1] Smith, J. (2023). Machine learning research methods. Journal of Computing.",
      ].join("\n"),
      selectedStyle: "numbered",
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.result.selectedStyle).toBe("numbered");
    expect(body.result.detectedReferenceCount).toBe(1);
    expect(body.privacy).toEqual({
      persisted: false,
      storage: "memory_only",
      externalServicesUsed: false,
    });
  });

  it("rejects empty manuscript text", async () => {
    const response = await validationRequest({ manuscriptText: "   " });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_CITATION_STYLE_REQUEST");
  });

  it("rejects a missing manuscript", async () => {
    const response = await validationRequest({});
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_CITATION_STYLE_REQUEST");
  });

  it("rejects unsupported style names", async () => {
    const response = await validationRequest({
      manuscriptText: "References\n[1] Example author. Example title.",
      selectedStyle: "APA",
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_CITATION_STYLE_REQUEST");
  });

  it("rejects text exceeding the supported length", async () => {
    const response = await validationRequest({
      manuscriptText: "a".repeat(200_001),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_CITATION_STYLE_REQUEST");
  });
});
