
import { Router } from "express";
import { researchGapAnalysisRequestSchema } from "@paperpilot/shared";
import { analyzeResearchGaps } from "./research-gap-analysis.js";

const router = Router();

router.post("/", (req, res) => {
  const parsed = researchGapAnalysisRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "INVALID_RESEARCH_GAP_ANALYSIS_REQUEST",
        message:
          "Provide non-empty extracted document text containing no more than 2,000,000 characters.",
      },
    });
    return;
  }

  const report = analyzeResearchGaps(parsed.data.documentText);

  res.status(200).json({
    report,
    privacy: {
      persisted: false,
      storage: "memory_only",
      externalServicesUsed: false,
    },
  });
});

export default router;
