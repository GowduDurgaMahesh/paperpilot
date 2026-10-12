
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  InterviewService,
  InterviewServiceError,
  type InterviewContext,
  type InterviewProvider,
} from "../apps/api/src/interview-service.ts";

const firstQuestion = {
  id: "research-problem",
  text: "What specific research problem are you trying to solve?",
  purpose: "Understand the research problem.",
};

const nextQuestion = {
  id: "research-method",
  text: "What method will you use to investigate it?",
  purpose: "Understand the proposed methodology.",
};

const context = {
  filename: "paper.pdf",
  documentText: "Test manuscript text.",
  history: [],
} satisfies InterviewContext;

function createProvider(
  answerInterview: InterviewProvider["answerInterview"] = async () =>
    nextQuestion,
): InterviewProvider {
  return {
    async startInterview() {
      return firstQuestion;
    },
    answerInterview,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Interview service reliability", () => {
  it("does not record an answer when the provider fails", async () => {
    let shouldFail = true;

    const service = new InterviewService(
      createProvider(async () => {
        if (shouldFail) {
          throw new Error("Temporary provider failure");
        }

        return nextQuestion;
      }),
    );

    const started = await service.start("paper.pdf", context.documentText);

    await expect(
      service.submitAnswer(started.sessionId, "My research answer."),
    ).rejects.toThrow("Temporary provider failure");

    const unchanged = service.get(started.sessionId);

    expect(unchanged.answeredCount).toBe(0);
    expect(unchanged.question?.id).toBe(firstQuestion.id);

    shouldFail = false;

    const retried = await service.submitAnswer(
      started.sessionId,
      "My research answer.",
    );

    expect(retried.answeredCount).toBe(1);
    expect(retried.question?.id).toBe(nextQuestion.id);
  });

  it("rejects concurrent answers for the same question", async () => {
    let releaseProvider!: (question: typeof nextQuestion) => void;

    const providerPromise = new Promise<typeof nextQuestion>((resolve) => {
      releaseProvider = resolve;
    });

    const service = new InterviewService(
      createProvider(() => providerPromise),
    );

    const started = await service.start("paper.pdf", context.documentText);

    const firstSubmission = service.submitAnswer(
      started.sessionId,
      "First answer.",
    );

    await expect(
      service.submitAnswer(started.sessionId, "Second answer."),
    ).rejects.toMatchObject({
      code: "INTERVIEW_BUSY",
    });

    releaseProvider(nextQuestion);

    const result = await firstSubmission;

    expect(result.answeredCount).toBe(1);
    expect(result.question?.id).toBe(nextQuestion.id);
  });

  it("does not record an answer when the provider returns an invalid question", async () => {
    const service = new InterviewService(
      createProvider(async () => {
        return {
          id: "",
          text: "",
          purpose: "",
        } as typeof nextQuestion;
      }),
    );

    const started = await service.start("paper.pdf", context.documentText);

    await expect(
      service.submitAnswer(started.sessionId, "My research answer."),
    ).rejects.toMatchObject({
      code: "INVALID_PROVIDER_RESPONSE",
    });

    const unchanged = service.get(started.sessionId);

    expect(unchanged.answeredCount).toBe(0);
    expect(unchanged.question?.id).toBe(firstQuestion.id);
  });

  it("times out a provider call without recording the answer", async () => {
    const service = new InterviewService(
      createProvider(() => new Promise(() => {})),
    );

    const started = await service.start("paper.pdf", context.documentText);

    vi.useFakeTimers();

    try {
      const pending = service.submitAnswer(
        started.sessionId,
        "My research answer.",
      );

      const assertion = expect(pending).rejects.toMatchObject({
        code: "INTERVIEW_PROVIDER_TIMEOUT",
      });

      await vi.advanceTimersByTimeAsync(15_001);
      await assertion;

      const unchanged = service.get(started.sessionId);

      expect(unchanged.answeredCount).toBe(0);
      expect(unchanged.question?.id).toBe(firstQuestion.id);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not resurrect a session deleted while the provider is running", async () => {
    let releaseProvider!: (question: typeof nextQuestion) => void;

    const providerPromise = new Promise<typeof nextQuestion>((resolve) => {
      releaseProvider = resolve;
    });

    const service = new InterviewService(
      createProvider(() => providerPromise),
    );

    const started = await service.start("paper.pdf", context.documentText);

    const pending = service.submitAnswer(
      started.sessionId,
      "My research answer.",
    );

    expect(service.delete(started.sessionId)).toBe(true);

    releaseProvider(nextQuestion);

    await expect(pending).rejects.toMatchObject({
      code: "INTERVIEW_SESSION_NOT_FOUND",
    });

    expect(() => service.get(started.sessionId)).toThrow(
      "not found or has expired",
    );
  });

  it("releases the session lock after a provider timeout so the user can retry", async () => {
    let shouldHang = true;

    const service = new InterviewService(
      createProvider(async () => {
        if (shouldHang) {
          return new Promise<typeof nextQuestion>(() => {});
        }

        return nextQuestion;
      }),
    );

    const started = await service.start("paper.pdf", context.documentText);

    vi.useFakeTimers();

    try {
      const pending = service.submitAnswer(
        started.sessionId,
        "My research answer.",
      );

      const assertion = expect(pending).rejects.toMatchObject({
        code: "INTERVIEW_PROVIDER_TIMEOUT",
      });

      await vi.advanceTimersByTimeAsync(15_001);
      await assertion;
    } finally {
      vi.useRealTimers();
    }

    shouldHang = false;

    const retry = await service.submitAnswer(
      started.sessionId,
      "My research answer.",
    );

    expect(retry.answeredCount).toBe(1);
    expect(retry.question?.id).toBe(nextQuestion.id);
  });
});
