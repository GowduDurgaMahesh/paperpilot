
import { randomUUID } from "node:crypto";
import {
  interviewQuestionSchema,
  interviewResponseSchema,
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
  startInterview(context: InterviewContext): Promise<InterviewQuestion>;
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
  lastActivityAt: number;
  processing: boolean;
}

export class InterviewServiceError extends Error {
  constructor(
    public readonly code:
      | "AI_PROVIDER_NOT_CONFIGURED"
      | "INTERVIEW_SESSION_NOT_FOUND"
      | "INTERVIEW_NOT_IN_PROGRESS"
      | "INVALID_PROVIDER_RESPONSE"
      | "INTERVIEW_CAPACITY_REACHED"
      | "INTERVIEW_BUSY"
      | "INTERVIEW_PROVIDER_TIMEOUT",
    message: string,
  ) {
    super(message);
    this.name = "InterviewServiceError";
  }
}

const SESSION_TTL_MS = 30 * 60 * 1000;
const PROVIDER_TIMEOUT_MS = 15_000;
const MAX_SESSIONS = 100;
const MAX_ANSWERED_QUESTIONS = 100;

export class InterviewService {
  private readonly sessions = new Map<string, InterviewSession>();
  private pendingStarts = 0;

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

    if (this.sessions.size + this.pendingStarts >= MAX_SESSIONS) {
      throw new InterviewServiceError(
        "INTERVIEW_CAPACITY_REACHED",
        "Interview capacity has been reached. Try again after an existing session expires or is deleted.",
      );
    }

    // Reserve capacity before awaiting the provider so concurrent starts
    // cannot exceed the configured limit.
    this.pendingStarts += 1;

    try {
      const firstQuestion = await this.withProviderTimeout(
        () =>
          this.provider!.startInterview({
            filename,
            documentText,
            history: [],
          }),
      );

      const validatedQuestion = this.validateQuestion(firstQuestion);

      // Recheck capacity and expiry after the asynchronous provider call.
      this.cleanupExpiredSessions();

      if (this.sessions.size >= MAX_SESSIONS) {
        throw new InterviewServiceError(
          "INTERVIEW_CAPACITY_REACHED",
          "Interview capacity has been reached. Please try again later.",
        );
      }

      const timestamp = this.now();
      const session: InterviewSession = {
        id: randomUUID(),
        filename,
        documentText,
        history: [],
        currentQuestion: validatedQuestion,
        status: "in_progress",
        lastActivityAt: timestamp,
        processing: false,
      };

      this.sessions.set(session.id, session);

      return this.toResponse(
        session,
        "The interview has started. Answer one question at a time.",
      );
    } finally {
      this.pendingStarts -= 1;
    }
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

    if (session.processing) {
      throw new InterviewServiceError(
        "INTERVIEW_BUSY",
        "An answer is already being processed for this interview. Wait for it to finish before submitting another answer.",
      );
    }

    // Lock this session before awaiting the provider. A second submission
    // cannot process the same question at the same time.
    session.processing = true;

    try {
      const currentQuestion = session.currentQuestion;
      const context: InterviewContext = {
        filename: session.filename,
        documentText: session.documentText,
        history: session.history.map((turn) => ({ ...turn })),
      };

      const nextQuestion = await this.withProviderTimeout(() =>
        this.provider!.answerInterview(context, currentQuestion, answer),
      );

      // A provider response must never restore a deleted or expired session.
      this.cleanupExpiredSessions();

      if (this.sessions.get(sessionId) !== session) {
        throw new InterviewServiceError(
          "INTERVIEW_SESSION_NOT_FOUND",
          "This interview session was deleted or expired while the answer was being processed. Start a new interview.",
        );
      }

      // Validate before changing any session state.
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
          "The interview is complete. Answers are stored in memory only until the session is deleted, expires, or the API process stops.",
        );
      }

      session.currentQuestion = validatedNextQuestion;

      return this.toResponse(
        session,
        "Your answer was recorded in this in-memory session. Review the next question and answer in your own words.",
      );
    } finally {
      session.processing = false;
    }
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
        : session.processing
          ? "Your answer is being processed."
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

  private async withProviderTimeout<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      return await Promise.race([
        Promise.resolve().then(operation),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => {
            reject(
              new InterviewServiceError(
                "INTERVIEW_PROVIDER_TIMEOUT",
                "The interview provider did not respond in time. Your answer was not recorded. You can retry.",
              ),
            );
          }, PROVIDER_TIMEOUT_MS);
        }),
      ]);
    } finally {
      if (timeout !== undefined) {
        clearTimeout(timeout);
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

// Production default: no provider is configured.
// Tests may inject a test-only provider to verify the workflow.
export const interviewService = new InterviewService(null);
