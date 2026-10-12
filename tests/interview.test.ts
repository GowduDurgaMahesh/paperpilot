import { afterEach, describe, expect, it } from "vitest";
import app from "../apps/api/src/app.js";
import {
  InterviewService,
  InterviewServiceError,
} from "../apps/api/src/interview-service.ts";

const BASE_URL = "http://127.0.0.1:4000";
const SESSION_ID = "550e8400-e29b-41d4-a716-446655440000";

let server: ReturnType<typeof app.listen> | undefined;
let baseUrl = BASE_URL;

async function startTestServer(): Promise<void> {
  if (server) {
    return;
  }

  server = app.listen(0, "127.0.0.1");

  await new Promise<void>((resolve, reject) => {
    server?.once("listening", resolve);
    server?.once("error", reject);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Could not determine the test server address.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server?.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  server = undefined;
});

describe("Interview API consent and provider safeguards", () => {
  it("rejects an interview start request without consent", async () => {
    await startTestServer();

    const response = await fetch(`${baseUrl}/api/interviews/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "paper.pdf",
        documentText: "Extracted manuscript text for testing.",
      }),
    });

    expect(response.status).toBe(403);

    const body = await response.json();

    expect(body.error.code).toBe("HOSTED_AI_CONSENT_REQUIRED");
  });

  it("does not claim an interview started when no AI provider is configured", async () => {
    await startTestServer();

    const response = await fetch(`${baseUrl}/api/interviews/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "paper.pdf",
        documentText: "Extracted manuscript text for testing.",
        consent: {
          accepted: true,
          provider: "Test AI provider",
          policyVersion: "test-policy-v1",
          consentedAt: "2026-10-12T10:00:00.000Z",
        },
      }),
    });

    expect(response.status).toBe(503);

    const body = await response.json();

    expect(body.error.code).toBe("AI_PROVIDER_NOT_CONFIGURED");
  });

  it("rejects an empty answer", async () => {
    await startTestServer();

    const response = await fetch(
      `${baseUrl}/api/interviews/${SESSION_ID}/answers`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: "   " }),
      },
    );

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body.error.code).toBe("INVALID_INTERVIEW_ANSWER");
  });

  it("returns not found for an unknown interview session", async () => {
    await startTestServer();

    const response = await fetch(
      `${baseUrl}/api/interviews/${SESSION_ID}`,
    );

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body.error.code).toBe("INTERVIEW_SESSION_NOT_FOUND");
  });

  it("returns not found when deleting an unknown session", async () => {
    await startTestServer();

    const response = await fetch(
      `${baseUrl}/api/interviews/${SESSION_ID}`,
      { method: "DELETE" },
    );

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body.error.code).toBe("INTERVIEW_SESSION_NOT_FOUND");
  });
});

describe("Interview service session management", () => {
  it("reports a clear error when no provider is configured", async () => {
    const service = new InterviewService(null);

    await expect(
      service.start("paper.pdf", "Extracted manuscript text."),
    ).rejects.toMatchObject({
      code: "AI_PROVIDER_NOT_CONFIGURED",
    });
  });

  it("returns false when deleting a session that does not exist", () => {
    const service = new InterviewService(null);

    expect(service.delete(SESSION_ID)).toBe(false);
  });

  it("removes expired sessions from memory", async () => {
    let clock = 1_000;

    const question = {
      id: "question-1",
      text: "What problem does your research address?",
      purpose: "Understand the researcher's current knowledge.",
    };

    const provider = {
      async startInterview() {
        return question;
      },
      async answerInterview() {
        return null;
      },
    };

    const service = new InterviewService(provider, () => clock);

    const started = await service.start(
      "paper.pdf",
      "Extracted manuscript text.",
    );

    expect(started.status).toBe("in_progress");

    clock += 31 * 60 * 1000;

    expect(() => service.get(started.sessionId)).toThrowError(
      InterviewServiceError,
    );

    expect(() => service.get(started.sessionId)).toThrow(
      "not found or has expired",
    );
  });
});