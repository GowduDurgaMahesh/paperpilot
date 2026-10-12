import { Router } from "express";
import multer from "multer";
import mammoth from "mammoth";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { InvalidDocxError, validateDocxArchive } from "./docx-validation.js";

const router = Router();
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_PDF_PAGES = 300;
const MAX_EXTRACTED_CHARACTERS = 2_000_000;
const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 0 },
});

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}

router.post("/extract", upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: { code: "FILE_REQUIRED", message: 'Upload one PDF or DOCX file using the field name "file".' } });
      return;
    }

    const filename = file.originalname;
    const extension = filename.toLowerCase().split(".").pop();
    let text = "";
    let pageCount: number | null = null;
    let format: "pdf" | "docx";

    if (extension === "pdf" && file.mimetype === "application/pdf") {
      if (file.buffer.length < 5 || file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
        res.status(400).json({ error: { code: "INVALID_PDF", message: "The file does not have a valid PDF signature." } });
        return;
      }
      format = "pdf";
      const loadingTask = getDocument({ data: new Uint8Array(file.buffer), useSystemFonts: true });
      try {
        const document = await loadingTask.promise;
        pageCount = document.numPages;
        if (pageCount > MAX_PDF_PAGES) {
          res.status(413).json({ error: { code: "TOO_MANY_PAGES", message: `PDFs may contain at most ${MAX_PDF_PAGES} pages.` } });
          return;
        }
        const pageTexts: string[] = [];
        let characterCount = 0;
        for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
          const page = await document.getPage(pageNumber);
          try {
            const content = await page.getTextContent();
            const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
            characterCount += pageText.length;
            if (characterCount > MAX_EXTRACTED_CHARACTERS) {
              res.status(413).json({ error: { code: "TEXT_TOO_LARGE", message: "The extracted document text exceeds the processing limit." } });
              return;
            }
            pageTexts.push(pageText);
          } finally {
            page.cleanup();
          }
        }
        text = pageTexts.join("\n\n");
      } finally {
        await loadingTask.destroy();
      }
    } else if (extension === "docx" && file.mimetype === DOCX_MIME_TYPE) {
      format = "docx";
      try {
        await validateDocxArchive(file.buffer);
      } catch (error) {
        if (error instanceof InvalidDocxError) {
          res.status(400).json({ error: { code: "INVALID_DOCX", message: "The file is not a valid DOCX package or exceeds archive safety limits." } });
          return;
        }
        throw error;
      }
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value;
      if (text.length > MAX_EXTRACTED_CHARACTERS) {
        res.status(413).json({ error: { code: "TEXT_TOO_LARGE", message: "The extracted document text exceeds the processing limit." } });
        return;
      }
    } else {
      res.status(415).json({ error: { code: "UNSUPPORTED_FILE", message: "Only PDF files with the application/pdf MIME type and DOCX files with the official DOCX MIME type are supported." } });
      return;
    }

    const normalizedText = text.replace(/\r\n?/gu, "\n").trim();
    res.status(200).json({
      document: {
        filename, format, sizeBytes: file.size, pageCount,
        characterCount: normalizedText.length,
        wordCount: countWords(normalizedText),
        extractionStatus: normalizedText ? "completed" : format === "pdf" ? "no_extractable_text" : "empty_document",
        text: normalizedText,
      },
      privacy: { persisted: false, storage: "memory_only" },
    });
  } catch (error) {
    next(error);
  }
});

export default router;