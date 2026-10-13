
import { Router } from "express";
import { z } from "zod";
import { validateCitationStyle } from "./citation-style-validation.js";

const router = Router();

const requestSchema = z.object({
  manuscriptText: z.string().trim().min(1).max(200_000),
  selectedStyle: z.literal("numbered").optional(),
});

router.post("/", (req, res) => {
  const parsed = requestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "INVALID_CITATION_STYLE_REQUEST",
        message:
          "Provide non-empty manuscript text containing at most 200,000 characters and a supported style.",
      },
    });
    return;
  }

  try {
    const result = validateCitationStyle(
      parsed.data.manuscriptText,
      parsed.data.selectedStyle ?? "numbered",
    );

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
        : "Citation style validation could not be completed.";

    const isValidationError =
      message === "Provide manuscript text to validate." ||
      message.startsWith("Manuscript text must be ");

    res.status(isValidationError ? 400 : 500).json({
      error: {
        code: isValidationError
          ? "INVALID_CITATION_STYLE_REQUEST"
          : "CITATION_STYLE_VALIDATION_FAILED",
        message: isValidationError
          ? message
          : "Citation style validation could not be completed.",
      },
    });
  }
});

export default router;
