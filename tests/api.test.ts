
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { deflateRawSync } from "node:zlib";
import app from "../apps/api/src/app.js";

let server: Server;
let baseUrl: string;

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PDF_MIME = "application/pdf";
const MAX_FILE_SIZE = 20 * 1024 * 1024;

beforeAll(async () => {
  server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not determine the API test server port.");
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  if (server?.listening) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

async function uploadFile(
  filename: string,
  content: string | Uint8Array,
  contentType: string,
) {
  const form = new FormData();
  form.append("file", new Blob([content], { type: contentType }), filename);
  return fetch(`${baseUrl}/api/documents/extract`, {
    method: "POST",
    body: form,
  });
}

async function auditStructure(body: unknown) {
  return fetch(`${baseUrl}/api/documents/audit-structure`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makePdf(text: string): Buffer {
  const escaped = text
    .replace(/\\/gu, "\\\\")
    .replace(/\(/gu, "\\(")
    .replace(/\)/gu, "\\)");

  const stream = `BT\n/F1 18 Tf\n72 720 Td\n(${escaped}) Tj\nET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "ascii");
}

function makeCrc32(data: Buffer): number {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function makeZip(files: Array<{ name: string; data: Buffer }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name);
    const compressed = deflateRawSync(file.data);
    const crc = makeCrc32(file.data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);

    localParts.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);

    centralParts.push(central, name);
    offset += local.length + name.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

function makeDocx(text: string, documentPath = "word/document.xml"): Buffer {
  const content = Buffer.from(
    `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p><w:sectPr/></w:body></w:document>`,
    "utf8",
  );

  return makeZip([
    {
      name: "[Content_Types].xml",
      data: Buffer.from(
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
      ),
    },
    { name: documentPath, data: content },
  ]);
}

describe("Document extraction API", () => {
  it("reports API health", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("paperpilot-api");
  });

  it("rejects a request without a file", async () => {
    const response = await fetch(`${baseUrl}/api/documents/extract`, {
      method: "POST",
    });

    expect(response.status).toBe(400);
  });

  it("rejects unsupported file types", async () => {
    const response = await uploadFile("notes.txt", "Unsupported file", "text/plain");
    const body = await response.json();

    expect(response.status).toBe(415);
    expect(body.error.code).toBe("UNSUPPORTED_FILE");
  });

  it("rejects a DOCX without a ZIP signature", async () => {
    const response = await uploadFile(
      "invalid.docx",
      "Not a DOCX archive",
      DOCX_MIME,
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_DOCX");
  });

  it("rejects a DOCX missing its required document part", async () => {
    const response = await uploadFile(
      "missing-document.docx",
      makeDocx("sample", "word/other.xml"),
      DOCX_MIME,
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_DOCX");
  });

  it("rejects a DOCX containing an unsafe archive path", async () => {
    const response = await uploadFile(
      "unsafe.docx",
      makeDocx("sample", "../word/document.xml"),
      DOCX_MIME,
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_DOCX");
  });

  it("rejects a PDF with invalid contents", async () => {
    const response = await uploadFile(
      "invalid.pdf",
      "%PDF-1.4 invalid contents",
      PDF_MIME,
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe("DOCUMENT_PROCESSING_FAILED");
  });

  it("extracts text from a valid PDF", async () => {
    const response = await uploadFile(
      "sample.pdf",
      makePdf("Paperpilot PDF extraction works"),
      PDF_MIME,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.document.format).toBe("pdf");
    expect(body.document.extractionStatus).toBe("completed");
    expect(body.document.text).toContain("Paperpilot PDF extraction works");
    expect(body.document.wordCount).toBeGreaterThan(0);
    expect(body.privacy.persisted).toBe(false);
    expect(body.privacy.storage).toBe("memory_only");
  });

  it("extracts text from a valid DOCX", async () => {
    const response = await uploadFile(
      "sample.docx",
      makeDocx("Paperpilot DOCX extraction works"),
      DOCX_MIME,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.document.format).toBe("docx");
    expect(body.document.extractionStatus).toBe("completed");
    expect(body.document.text).toContain("Paperpilot DOCX extraction works");
    expect(body.document.wordCount).toBeGreaterThan(0);
    expect(body.privacy.persisted).toBe(false);
  });

  it("returns no_extractable_text for a PDF with no text", async () => {
    const response = await uploadFile("blank.pdf", makePdf(""), PDF_MIME);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.document.format).toBe("pdf");
    expect(body.document.extractionStatus).toBe("no_extractable_text");
    expect(body.document.text).toBe("");
    expect(body.document.characterCount).toBe(0);
    expect(body.document.wordCount).toBe(0);
  });

  it("returns empty_document for an empty DOCX", async () => {
    const response = await uploadFile("empty.docx", makeDocx(""), DOCX_MIME);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.document.format).toBe("docx");
    expect(body.document.extractionStatus).toBe("empty_document");
    expect(body.document.text).toBe("");
    expect(body.document.characterCount).toBe(0);
    expect(body.document.wordCount).toBe(0);
  });

  it("does not reject short non-empty text as empty", async () => {
    const response = await uploadFile(
      "short.docx",
      makeDocx("Short text"),
      DOCX_MIME,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.document.extractionStatus).toBe("completed");
    expect(body.document.text).toBe("Short text");
    expect(body.document.wordCount).toBe(2);
  });

  it("rejects uploads larger than 20 MiB", async () => {
    const response = await uploadFile(
      "oversized.pdf",
      new Uint8Array(MAX_FILE_SIZE + 1),
      PDF_MIME,
    );
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body.error.code).toBe("FILE_TOO_LARGE");
  });
});

describe("Document structure audit API", () => {
  it("returns all structure checks for valid extracted text", async () => {
    const response = await auditStructure({
      documentText: [
        "Abstract",
        "Introduction",
        "Related Work",
        "Methodology",
        "Results",
        "Discussion",
        "Limitations",
        "Conclusion",
        "References",
      ].join("\n"),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.audit.auditType).toBe("document_structure");
    expect(body.audit.method).toBe("heading_detection");
    expect(body.audit.checks).toHaveLength(9);
    expect(body.audit.detectedCount).toBe(9);
    expect(body.audit.notDetectedCount).toBe(0);
    expect(body.privacy).toEqual({
      persisted: false,
      storage: "memory_only",
      externalServicesUsed: false,
    });
  });

  it("rejects a missing documentText field", async () => {
    const response = await auditStructure({});
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_AUDIT_REQUEST");
  });

  it("rejects empty or whitespace-only document text", async () => {
    for (const documentText of ["", "   \n\t "]) {
      const response = await auditStructure({ documentText });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("INVALID_AUDIT_REQUEST");
    }
  });

  it("rejects non-string document text", async () => {
    const response = await auditStructure({ documentText: 123 });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_AUDIT_REQUEST");
  });

  it("does not claim to assess plagiarism or novelty", async () => {
    const response = await auditStructure({
      documentText: "Abstract\nIntroduction",
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.audit.limitations.some((item: string) =>
      item.includes("plagiarism"),
    )).toBe(true);
    expect(body.audit.limitations.some((item: string) =>
      item.includes("novelty"),
    )).toBe(true);
  });
});
