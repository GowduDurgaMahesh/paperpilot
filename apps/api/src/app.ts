
import cors from "cors";
import express from "express";
import helmet from "helmet";
import multer from "multer";
import documentsRouter from "./documents.js";
import interviewsRouter from "./interviews.js";
import researchQualityRouter from "./research-quality-route.js";
import structureAuditRouter from "./structure-audit-route.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());

app.use(
  cors({
    origin: "http://127.0.0.1:5173",
    methods: ["GET", "POST", "DELETE"],
  }),
);

app.use(express.json({ limit: "3mb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "paperpilot-api",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/documents", documentsRouter);
app.use("/api/documents/audit-structure", structureAuditRouter);
app.use("/api/research-quality/analyze", researchQualityRouter);
app.use("/api/interviews", interviewsRouter);

app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested API endpoint does not exist.",
    },
  });
});

app.use(
  (
    error: unknown,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (res.headersSent) {
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({
          error: {
            code: "FILE_TOO_LARGE",
            message: "The maximum upload size is 20 MB.",
          },
        });
        return;
      }

      res.status(400).json({
        error: {
          code: "UPLOAD_REJECTED",
          message: "The upload was rejected. Submit one file at a time.",
        },
      });
      return;
    }

    if (req.path.startsWith("/api/documents/")) {
      res.status(422).json({
        error: {
          code: "DOCUMENT_PROCESSING_FAILED",
          message:
            "The document could not be processed. Try another valid file.",
        },
      });
      return;
    }

    console.error("Unexpected API request failure.");

    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "The request could not be completed. Please try again.",
      },
    });
  },
);

export default app;
