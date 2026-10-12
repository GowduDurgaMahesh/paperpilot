import { describe, expect, it } from "vitest";
import {
  documentFormatSchema,
  researchQuestionSchema,
  researchSourceSchema,
  hostedAiConsentSchema,
  startInterviewSchema,
  submitInterviewAnswerSchema,
  interviewQuestionSchema,
  interviewResponseSchema,
} from "../packages/shared/src/index.ts";

describe("document format validation", () => {
  it("accepts PDF and DOCX", () => {
    expect(documentFormatSchema.safeParse("pdf").success).toBe(true);
    expect(documentFormatSchema.safeParse("docx").success).toBe(true);
  });

  it("rejects unsupported document formats", () => {
    expect(documentFormatSchema.safeParse("txt").success).toBe(false);
  });
});

describe("research question validation", () => {
  it("accepts a meaningful research question", () => {
    expect(
      researchQuestionSchema.safeParse({
        question: "How does machine learning improve medical imaging?",
      }).success,
    ).toBe(true);
  });

  it("rejects a question that is too short", () => {
    expect(
      researchQuestionSchema.safeParse({ question: "Why?" }).success,
    ).toBe(false);
  });
});

describe("research source validation", () => {
  it("requires a valid URL and retrieval timestamp", () => {
    const result = researchSourceSchema.safeParse({
      title: "Example research paper",
      url: "https://example.org/paper",
      provider: "Example provider",
      retrievedAt: "2026-10-12T10:00:00.000Z",
      coverage: "metadata_only",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid URL", () => {
    const result = researchSourceSchema.safeParse({
      title: "Example research paper",
      url: "not-a-url",
      provider: "Example provider",
      retrievedAt: "2026-10-12T10:00:00.000Z",
      coverage: "metadata_only",
    });

    expect(result.success).toBe(false);
  });
});

describe("hosted AI consent validation", () => {
  const validConsent = {
    accepted: true as const,
    provider: "Test AI provider",
    policyVersion: "test-policy-v1",
    consentedAt: "2026-10-12T10:00:00.000Z",
  };

  it("accepts explicit consent with a provider and policy version", () => {
    expect(hostedAiConsentSchema.safeParse(validConsent).success).toBe(true);
  });

  it("rejects consent that was not accepted", () => {
    expect(
      hostedAiConsentSchema.safeParse({
        ...validConsent,
        accepted: false,
      }).success,
    ).toBe(false);
  });

  it("rejects consent without a provider or policy version", () => {
    expect(
      hostedAiConsentSchema.safeParse({
        ...validConsent,
        provider: " ",
      }).success,
    ).toBe(false);

    expect(
      hostedAiConsentSchema.safeParse({
        ...validConsent,
        policyVersion: "",
      }).success,
    ).toBe(false);
  });
});

describe("interview request validation", () => {
  it("accepts a valid interview start request", () => {
    const result = startInterviewSchema.safeParse({
      filename: "research-paper.pdf",
      documentText: "Extracted research manuscript text.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty manuscript", () => {
    expect(
      startInterviewSchema.safeParse({
        filename: "research-paper.pdf",
        documentText: "",
      }).success,
    ).toBe(false);
  });

  it("accepts a non-empty interview answer", () => {
    expect(
      submitInterviewAnswerSchema.safeParse({
        answer: "I understand the basic concepts but need help evaluating the evidence.",
      }).success,
    ).toBe(true);
  });

  it("rejects an empty interview answer", () => {
    expect(
      submitInterviewAnswerSchema.safeParse({ answer: "   " }).success,
    ).toBe(false);
  });
});

describe("interview question validation", () => {
  const validQuestion = {
    id: "question-1",
    text: "What problem is your research trying to solve?",
    purpose: "Understand the researcher's current understanding.",
    answerHint: "Describe the problem in your own words.",
  };

  it("accepts a valid interview question", () => {
    expect(interviewQuestionSchema.safeParse(validQuestion).success).toBe(true);
  });

  it("rejects a question without a purpose", () => {
    expect(
      interviewQuestionSchema.safeParse({
        ...validQuestion,
        purpose: "",
      }).success,
    ).toBe(false);
  });
});

describe("interview response validation", () => {
  const sessionId = "550e8400-e29b-41d4-a716-446655440000";

  const validQuestion = {
    id: "question-1",
    text: "What is the main problem your research addresses?",
    purpose: "Understand the researcher's current knowledge.",
  };

  it("accepts an in-progress response containing one question", () => {
    const result = interviewResponseSchema.safeParse({
      sessionId,
      status: "in_progress",
      question: validQuestion,
      answeredCount: 0,
      message: "Let's begin with your current understanding.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an in-progress response without a question", () => {
    const result = interviewResponseSchema.safeParse({
      sessionId,
      status: "in_progress",
      answeredCount: 0,
      message: "Interview started.",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a completed response that still contains a question", () => {
    const result = interviewResponseSchema.safeParse({
      sessionId,
      status: "completed",
      question: validQuestion,
      answeredCount: 3,
      message: "Interview completed.",
    });

    expect(result.success).toBe(false);
  });

  it("accepts an unavailable response without a question", () => {
    const result = interviewResponseSchema.safeParse({
      sessionId,
      status: "unavailable",
      answeredCount: 0,
      message: "AI interview is unavailable because no provider is configured.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid session ID", () => {
    const result = interviewResponseSchema.safeParse({
      sessionId: "not-a-uuid",
      status: "unavailable",
      answeredCount: 0,
      message: "AI interview is unavailable.",
    });

    expect(result.success).toBe(false);
  });
});