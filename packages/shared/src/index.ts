
import { z } from "zod";

// Existing document schemas
export const documentFormatSchema = z.enum(["pdf", "docx"]);

export type DocumentFormat = z.infer<typeof documentFormatSchema>;

// Retained for compatibility with the current UI.
// The adaptive interview will replace this workflow later.
export const researchQuestionSchema = z.object({
  question: z.string().trim().min(5).max(1000),
});

export type ResearchQuestion = z.infer<typeof researchQuestionSchema>;

// Existing source coverage schemas
export const sourceCoverageSchema = z.enum([
  "metadata_only",
  "abstract_reviewed",
  "full_text_reviewed",
]);

export type SourceCoverage = z.infer<typeof sourceCoverageSchema>;

export const researchSourceSchema = z.object({
  title: z.string().trim().min(1),
  doi: z.string().trim().optional(),
  url: z.string().url(),
  provider: z.string().trim().min(1),
  retrievedAt: z.string().datetime(),
  coverage: sourceCoverageSchema,
});

export type ResearchSource = z.infer<typeof researchSourceSchema>;

// Interview lifecycle
export const interviewStatusSchema = z.enum([
  "awaiting_consent",
  "in_progress",
  "completed",
  "unavailable",
]);

export type InterviewStatus = z.infer<typeof interviewStatusSchema>;

// Only the hosted provider that the user is explicitly agreeing to use.
// Provider configuration and provider credentials remain server-side.
export const hostedAiConsentSchema = z.object({
  accepted: z.literal(true),
  provider: z.string().trim().min(1).max(100),
  policyVersion: z.string().trim().min(1).max(50),
  consentedAt: z.string().datetime(),
});

export type HostedAiConsent = z.infer<typeof hostedAiConsentSchema>;

// Request to begin an interview.
// The API must validate consent again before any hosted AI request.
export const startInterviewSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  documentText: z.string().min(1).max(2_000_000),
  consent: hostedAiConsentSchema.optional(),
});

export type StartInterviewRequest = z.infer<typeof startInterviewSchema>;

// A user's answer to the current interview question.
// Session ownership and question ordering must also be checked by the API.
export const submitInterviewAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(5000),
});

export type SubmitInterviewAnswerRequest = z.infer<
  typeof submitInterviewAnswerSchema
>;

// Public question shape returned by the interview API.
export const interviewQuestionSchema = z.object({
  id: z.string().trim().min(1).max(100),
  text: z.string().trim().min(1).max(2000),
  purpose: z.string().trim().min(1).max(500),
  answerHint: z.string().trim().max(500).optional(),
});

export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;

// Interview response contract.
// A completed interview must not include a next question.
export const interviewResponseSchema = z
  .object({
    sessionId: z.string().uuid(),
    status: interviewStatusSchema,
    question: interviewQuestionSchema.optional(),
    answeredCount: z.number().int().min(0).max(100),
    message: z.string().trim().min(1).max(1000),
  })
  .superRefine((value, context) => {
    if (value.status === "in_progress" && !value.question) {
      context.addIssue({
        code: "custom",
        path: ["question"],
        message: "An active interview must include its next question.",
      });
    }

    if (value.status !== "in_progress" && value.question) {
      context.addIssue({
        code: "custom",
        path: ["question"],
        message: "Only an active interview may include a next question.",
      });
    }
  });

export type InterviewResponse = z.infer<typeof interviewResponseSchema>;
