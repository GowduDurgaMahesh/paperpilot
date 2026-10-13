
import { Router } from "express";
import { z } from "zod";
import { analyzeCitationConsistency } from "./citation-consistency.js";

const router = Router();

const requestSchema = z.object({
  manuscriptText: z.string().trim().min(1).max(200_000),
});

router.post("/", (req, res) => {
  const parsed = requestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "INVALID_CITATION_CONSISTENCY_REQUEST",
        message:
          "Provide non-empty manuscript text containing at most 200,000 characters.",
      },
    });
    return;
  }

  try {
    const result = analyzeCitationConsistency(parsed.data.manuscriptText);

    res.status(200).json({
      result,
      privacy: {
        persisted: false,
        storage: "memory_only",
        externalServicesUsed: false,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Citation consistency analysis could not be completed.";

    const isValidationError =
      message === "Provide manuscript text to analyze." ||
      message.startsWith("Manuscript text must be ");

    res.status(isValidationError ? 400 : 500).json({
      error: {
        code: isValidationError
          ? "INVALID_CITATION_CONSISTENCY_REQUEST"
          : "CITATION_CONSISTENCY_ANALYSIS_FAILED",
        message: isValidationError
          ? message
          : "Citation consistency analysis could not be completed.",
      },
    });
  }
});

export default router;
