
import { Router } from "express";
import { z } from "zod";
import { searchAcademicSources } from "./academic-sources.js";

const router = Router();

const searchRequestSchema = z.object({
  query: z.string().trim().min(1).max(300),
  limit: z.number().int().min(1).max(20).optional(),
});

router.post("/", async (req, res) => {
  const parsed = searchRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "INVALID_ACADEMIC_SEARCH_REQUEST",
        message:
          "Provide a non-empty search query of at most 300 characters and an optional integer result limit from 1 to 20.",
      },
    });
    return;
  }

  try {
    const result = await searchAcademicSources(
      parsed.data.query,
      parsed.data.limit,
    );

    res.status(200).json({
      result,
      privacy: {
        persisted: false,
        storage: "memory_only",
        externalServicesUsed: true,
        externalProvider: "Crossref",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Academic search could not be completed.";

    const isValidationError =
      message === "Enter a research topic or search query." ||
      message.startsWith("Search queries must be ") ||
      message.startsWith("The result limit must be ");

    res.status(isValidationError ? 400 : 502).json({
      error: {
        code: isValidationError
          ? "INVALID_ACADEMIC_SEARCH_REQUEST"
          : "ACADEMIC_SEARCH_UNAVAILABLE",
        message,
      },
    });
  }
});

export default router;
