import type { InterviewContext, InterviewProvider } from "../../apps/api/src/interview-service.ts";
import type { InterviewQuestion } from "@paperpilot/shared";

/** Deterministic test-only provider. Makes no network requests and does not perform real AI analysis. */
export class DeterministicTestInterviewProvider implements InterviewProvider {
  async startInterview(_context: InterviewContext): Promise<InterviewQuestion> {
    return {
      id: "research-problem",
      text: "What specific research problem are you trying to solve?",
      purpose: "Establish the researcher's understanding of the problem."
    };
  }

  async answerInterview(context: InterviewContext, currentQuestion: InterviewQuestion, answer: string): Promise<InterviewQuestion | null> {
    const challengesFinding = /\b(challenge|disagree|incorrect|counterexample|evidence|contradict|not supported)\b/i.test(answer);

    if (challengesFinding && currentQuestion.id !== "evidence-follow-up") {
      return {
        id: "evidence-follow-up",
        text: "What specific source, passage, or result supports your challenge?",
        purpose: "Request verifiable evidence before treating a challenged finding as supported."
      };
    }

    if (currentQuestion.id === "evidence-follow-up") {
      return {
        id: "evidence-evaluation",
        text: "How does that evidence support your interpretation, and what are its limitations?",
        purpose: "Prompt critical evaluation rather than automatically accepting a claim."
      };
    }

    if (context.history.length === 0) {
      return {
        id: "research-method",
        text: "What method will you use to investigate the research problem, and why?",
        purpose: "Explore the proposed research methodology."
      };
    }

    if (context.history.length === 1) {
      return {
        id: "limitations",
        text: "What is one important limitation of your proposed approach?",
        purpose: "Explore awareness of research limitations."
      };
    }

    return null;
  }
}
