
import { describe, expect, it } from "vitest";
import { InterviewService } from "../apps/api/src/interview-service.ts";
import { DeterministicTestInterviewProvider } from "./helpers/deterministic-interview-provider.ts";

const filename = "test-paper.pdf";
const documentText = "Synthetic test manuscript text only.";

describe("Deterministic test interview provider", () => {
  it("starts with exactly one research question", async () => {
    const service = new InterviewService(
      new DeterministicTestInterviewProvider(),
    );

    const result = await service.start(filename, documentText);

    expect(result.status).toBe("in_progress");
    expect(result.answeredCount).toBe(0);
    expect(result.question?.id).toBe("research-problem");
    expect(result.question?.text).toContain("research problem");
  });

  it("asks sequential follow-up questions and completes", async () => {
    const service = new InterviewService(
      new DeterministicTestInterviewProvider(),
    );

    const first = await service.start(filename, documentText);
    expect(first.question?.id).toBe("research-problem");

    const second = await service.submitAnswer(
      first.sessionId,
      "I want to investigate the problem using a controlled experiment.",
    );
    expect(second.status).toBe("in_progress");
    expect(second.answeredCount).toBe(1);
    expect(second.question?.id).toBe("research-method");

    const third = await service.submitAnswer(
      first.sessionId,
      "I will compare outcomes between two groups.",
    );
    expect(third.status).toBe("in_progress");
    expect(third.answeredCount).toBe(2);
    expect(third.question?.id).toBe("limitations");

    const completed = await service.submitAnswer(
      first.sessionId,
      "A limitation is the small sample size.",
    );
    expect(completed.status).toBe("completed");
    expect(completed.answeredCount).toBe(3);
    expect(completed.question).toBeUndefined();
  });

  it("asks for evidence when a finding is challenged", async () => {
    const service = new InterviewService(
      new DeterministicTestInterviewProvider(),
    );

    const started = await service.start(filename, documentText);

    const challenge = await service.submitAnswer(
      started.sessionId,
      "I challenge that finding because the conclusion may be incorrect.",
    );

    expect(challenge.status).toBe("in_progress");
    expect(challenge.question?.id).toBe("evidence-follow-up");
    expect(challenge.question?.text).toContain("source");

    const evidence = await service.submitAnswer(
      started.sessionId,
      "The study on page four reports a different result.",
    );

    expect(evidence.status).toBe("in_progress");
    expect(evidence.question?.id).toBe("evidence-evaluation");
    expect(evidence.question?.text).toContain("limitations");
  });

  it("does not create a session when the provider fails to start", async () => {
    const failingProvider = {
      async startInterview() {
        throw new Error("Simulated provider failure");
      },
      async answerInterview() {
        return null;
      },
    };

    const service = new InterviewService(failingProvider);

    await expect(
      service.start(filename, documentText),
    ).rejects.toThrow("Simulated provider failure");
  });
});
