import { Router } from "express";
import {
  startInterviewSchema,
  submitInterviewAnswerSchema,
} from "@paperpilot/shared";
import {
  InterviewServiceError,
  interviewService,
} from "./interview-service.js";

const router = Router();

function sendServiceError(
  res: import("express").Response,
  error: unknown,
): void {
  if (!(error instanceof InterviewServiceError)) {
    res.status(503).json({
      error: {
        code: "INTERVIEW_PROVIDER_ERROR",
        message:
          "The interview could not continue because the interview provider failed. Your previous answers have not been advanced.",
      },
    });
    return;
  }

  const statusByCode: Record<InterviewServiceError["code"], number> = {
    AI_PROVIDER_NOT_CONFIGURED: 503,
    INTERVIEW_SESSION_NOT_FOUND: 404,
    INTERVIEW_NOT_IN_PROGRESS: 409,
    INVALID_PROVIDER_RESPONSE: 502,
  };

  res.status(statusByCode[error.code]).json({
    error: {
      code: error.code,
      message: error.message,
    },
  });
}

/**
 * Start an interview.
 *
 * Explicit hosted-AI consent is required before manuscript text can be
 * sent to a hosted provider. The production service currently has no
 * provider configured and will return AI_PROVIDER_NOT_CONFIGURED.
 */
router.post("/start", async (req, res) => {
  const parsed = startInterviewSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "INVALID_INTERVIEW_REQUEST",
        message: "Provide a filename and non-empty extracted manuscript text.",
      },
    });
    return;
  }

  if (!parsed.data.consent) {
    res.status(403).json({
      error: {
        code: "HOSTED_AI_CONSENT_REQUIRED",
        message:
          "Explicit consent is required before manuscript text can be sent to a hosted AI provider. No interview was started.",
      },
    });
    return;
  }

  try {
    const result = await interviewService.start(
      parsed.data.filename,
      parsed.data.documentText,
    );

    res.status(201).json(result);
  } catch (error) {
    sendServiceError(res, error);
  }
});

/**
 * Submit one answer and request the next adaptive question.
 */
router.post("/:sessionId/answers", async (req, res) => {
  const parsed = submitInterviewAnswerSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "INVALID_INTERVIEW_ANSWER",
        message: "Provide a non-empty answer of at most 5,000 characters.",
      },
    });
    return;
  }

  try {
    const result = await interviewService.submitAnswer(
      req.params.sessionId,
      parsed.data.answer,
    );

    res.status(200).json(result);
  } catch (error) {
    sendServiceError(res, error);
  }
});

/**
 * Retrieve the current interview question and session status.
 */
router.get("/:sessionId", (req, res) => {
  try {
    res.status(200).json(interviewService.get(req.params.sessionId));
  } catch (error) {
    sendServiceError(res, error);
  }
});

/**
 * Delete an interview session and its in-memory manuscript and answers.
 */
router.delete("/:sessionId", (req, res) => {
  const deleted = interviewService.delete(req.params.sessionId);

  if (!deleted) {
    res.status(404).json({
      error: {
        code: "INTERVIEW_SESSION_NOT_FOUND",
        message: "This interview session was not found or has already been deleted.",
      },
    });
    return;
  }

  res.status(204).end();
});

export default router;