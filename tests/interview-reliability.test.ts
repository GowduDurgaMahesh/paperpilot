
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
  startInterview: InterviewProvider["startInterview"] = async () =>
    firstQuestion,
): InterviewProvider {
  return {
    startInterview,
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

  it("rejects a 101st active session", async () => {
    const service = new InterviewService(createProvider());

    for (let index = 0; index < 100; index += 1) {
      await service.start(`paper-${index}.pdf`, context.documentText);
    }

    await expect(
      service.start("paper-101.pdf", context.documentText),
    ).rejects.toMatchObject({
      code: "INTERVIEW_CAPACITY_REACHED",
    });
  });

  it("does not exceed capacity when starts run concurrently", async () => {
    let startCalls = 0;
    let releaseProvider!: (question: typeof firstQuestion) => void;

    const providerPromise = new Promise<typeof firstQuestion>((resolve) => {
      releaseProvider = resolve;
    });

    const provider = createProvider(
      async () => nextQuestion,
      async () => {
        startCalls += 1;
        return providerPromise;
      },
    );

    const service = new InterviewService(provider);

    const starts = Array.from({ length: 101 }, (_, index) =>
      service.start(`paper-${index}.pdf`, context.documentText),
    );

    // Allow each start to reserve capacity before releasing the provider.
    await Promise.resolve();

    expect(startCalls).toBe(100);

    releaseProvider(firstQuestion);

    const results = await Promise.allSettled(starts);
    const successful = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(successful).toHaveLength(100);
    expect(rejected).toHaveLength(1);

    const rejection = rejected[0];

    expect(rejection?.status).toBe("rejected");

    if (rejection?.status === "rejected") {
      expect(rejection.reason).toBeInstanceOf(InterviewServiceError);
      expect(rejection.reason.code).toBe("INTERVIEW_CAPACITY_REACHED");
    }
  });

  it("does not record an answer if the session expires during provider processing", async () => {
    let clock = 1_000;
    let releaseProvider!: (question: typeof nextQuestion) => void;

    const providerPromise = new Promise<typeof nextQuestion>((resolve) => {
      releaseProvider = resolve;
    });

    const service = new InterviewService(
      createProvider(() => providerPromise),
      () => clock,
    );

    const started = await service.start("paper.pdf", context.documentText);

    const pending = service.submitAnswer(
      started.sessionId,
      "My research answer.",
    );

    clock += 30 * 60 * 1000;

    releaseProvider(nextQuestion);

    await expect(pending).rejects.toMatchObject({
      code: "INTERVIEW_SESSION_NOT_FOUND",
    });

    expect(() => service.get(started.sessionId)).toThrow(
      "not found or has expired",
    );
  });
});
