import { randomUUID } from "node:crypto";
import {
  interviewQuestionSchema,
  interviewResponseSchema,
  type interviewQuestionSchema as InterviewQuestionSchema,
} from "@paperpilot/shared";
import type { z } from "zod";

type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
type InterviewResponse = z.infer<typeof interviewResponseSchema>;

export interface InterviewTurn {
  question: InterviewQuestion;
  answer: string;
}

export interface InterviewContext {
  filename: string;
  documentText: string;
  history: InterviewTurn[];
}

export interface InterviewProvider {
  startInterview(
    context: InterviewContext,
  ): Promise<InterviewQuestion>;

  answerInterview(
    context: InterviewContext,
    currentQuestion: InterviewQuestion,
    answer: string,
  ): Promise<InterviewQuestion | null>;
}

interface InterviewSession {
  id: string;
  filename: string;
  documentText: string;
  history: InterviewTurn[];
  currentQuestion: InterviewQuestion | null;
  status: "in_progress" | "completed";
  createdAt: number;
  lastActivityAt: number;
}

export class InterviewServiceError extends Error {
  constructor(
    public readonly code:
      | "AI_PROVIDER_NOT_CONFIGURED"
      | "INTERVIEW_SESSION_NOT_FOUND"
      | "INTERVIEW_NOT_IN_PROGRESS"
      | "INVALID_PROVIDER_RESPONSE",
    message: string,
  ) {
    super(message);
    this.name = "InterviewServiceError";
  }
}

const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_SESSIONS = 100;
const MAX_ANSWERED_QUESTIONS = 100;

export class InterviewService {
  private readonly sessions = new Map<string, InterviewSession>();

  constructor(
    private readonly provider: InterviewProvider | null,
    private readonly now: () => number = Date.now,
  ) {}

  async start(
    filename: string,
    documentText: string,
  ): Promise<InterviewResponse> {
    this.cleanupExpiredSessions();

    if (!this.provider) {
      throw new InterviewServiceError(
        "AI_PROVIDER_NOT_CONFIGURED",
        "The AI interview is unavailable because no real AI provider is configured.",
      );
    }

    if (this.sessions.size >= MAX_SESSIONS) {
      throw new InterviewServiceError(
        "INTERVIEW_SESSION_NOT_FOUND",
        "The in-memory interview capacity has been reached. Try again after an existing session expires or is deleted.",
      );
    }

    const timestamp = this.now();
    const session: InterviewSession = {
      id: randomUUID(),
      filename,
      documentText,
      history: [],
      currentQuestion: null,
      status: "in_progress",
      createdAt: timestamp,
      lastActivityAt: timestamp,
    };

    // Store the session only after the provider returns a valid first question.
    const firstQuestion = await this.provider.startInterview({
      filename,
      documentText,
      history: [],
    });

    session.currentQuestion = this.validateQuestion(firstQuestion);
    this.sessions.set(session.id, session);

    return this.toResponse(
      session,
      "The interview has started. Answer one question at a time.",
    );
  }

  async submitAnswer(
    sessionId: string,
    answer: string,
  ): Promise<InterviewResponse> {
    this.cleanupExpiredSessions();

    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new InterviewServiceError(
        "INTERVIEW_SESSION_NOT_FOUND",
        "This interview session was not found or has expired. Start a new interview.",
      );
    }

    if (session.status !== "in_progress" || !session.currentQuestion) {
      throw new InterviewServiceError(
        "INTERVIEW_NOT_IN_PROGRESS",
        "This interview is no longer accepting answers.",
      );
    }

    if (!this.provider) {
      throw new InterviewServiceError(
        "AI_PROVIDER_NOT_CONFIGURED",
        "The AI interview is unavailable because no real AI provider is configured.",
      );
    }

    if (session.history.length >= MAX_ANSWERED_QUESTIONS) {
      throw new InterviewServiceError(
        "INTERVIEW_NOT_IN_PROGRESS",
        "The interview reached its maximum number of questions. Start a new interview to continue.",
      );
    }

    const currentQuestion = session.currentQuestion;
    const context: InterviewContext = {
      filename: session.filename,
      documentText: session.documentText,
      history: [...session.history],
    };

    // Ask the provider first. A provider failure must not record an answer
    // or advance the interview.
    const nextQuestion = await this.provider.answerInterview(
      context,
      currentQuestion,
      answer,
    );

    const validatedNextQuestion =
      nextQuestion === null ? null : this.validateQuestion(nextQuestion);

    session.history.push({
      question: currentQuestion,
      answer,
    });

    session.lastActivityAt = this.now();

    if (validatedNextQuestion === null) {
      session.currentQuestion = null;
      session.status = "completed";

      return this.toResponse(
        session,
        "The interview is complete. Your answers remain in memory only until the session is deleted, expires, or the API process stops.",
      );
    }

    session.currentQuestion = validatedNextQuestion;

    return this.toResponse(
      session,
      "Your answer was recorded in this in-memory session. Review the next question and answer in your own words.",
    );
  }

  get(sessionId: string): InterviewResponse {
    this.cleanupExpiredSessions();

    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new InterviewServiceError(
        "INTERVIEW_SESSION_NOT_FOUND",
        "This interview session was not found or has expired. Start a new interview.",
      );
    }

    session.lastActivityAt = this.now();

    return this.toResponse(
      session,
      session.status === "completed"
        ? "The interview is complete."
        : "Answer the current question to continue.",
    );
  }

  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  cleanupExpiredSessions(): void {
    const currentTime = this.now();

    for (const [id, session] of this.sessions.entries()) {
      if (currentTime - session.lastActivityAt >= SESSION_TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }

  private validateQuestion(question: InterviewQuestion): InterviewQuestion {
    const result = interviewQuestionSchema.safeParse(question);

    if (!result.success) {
      throw new InterviewServiceError(
        "INVALID_PROVIDER_RESPONSE",
        "The AI provider returned an invalid interview question. No interview progress was recorded.",
      );
    }

    return result.data;
  }

  private toResponse(
    session: InterviewSession,
    message: string,
  ): InterviewResponse {
    return interviewResponseSchema.parse({
      sessionId: session.id,
      status: session.status,
      ...(session.status === "in_progress" && session.currentQuestion
        ? { question: session.currentQuestion }
        : {}),
      answeredCount: session.history.length,
      message,
    });
  }
}

// Production default: no provider is configured, so AI calls fail explicitly.
// Tests may inject a test-only provider to verify the workflow.
export const interviewService = new InterviewService(null);
