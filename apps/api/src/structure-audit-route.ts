
import { Router } from "express";
import { documentStructureAuditRequestSchema } from "@paperpilot/shared";
import { auditDocumentStructure } from "./structure-audit.js";

const router = Router();

router.post("/", (req, res) => {
  const parsed = documentStructureAuditRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "INVALID_AUDIT_REQUEST",
        message:
          "Provide non-empty extracted document text containing no more than 2,000,000 characters.",
      },
    });
    return;
  }

  const result = auditDocumentStructure(parsed.data.documentText);

  res.status(200).json({
    audit: result,
    privacy: {
      persisted: false,
      storage: "memory_only",
      externalServicesUsed: false,
    },
  });
});

export default router;
