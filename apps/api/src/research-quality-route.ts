
import { Router } from "express";
import { researchQualityRequestSchema } from "@paperpilot/shared";
import { analyzeResearchQuality } from "./research-quality.js";

const router = Router();

router.post("/", (req, res) => {
  const parsed = researchQualityRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "INVALID_RESEARCH_QUALITY_REQUEST",
        message:
          "Provide non-empty extracted document text containing no more than 2,000,000 characters.",
      },
    });
    return;
  }

  const report = analyzeResearchQuality(parsed.data.documentText);

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
