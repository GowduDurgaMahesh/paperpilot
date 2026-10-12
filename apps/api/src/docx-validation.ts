import yauzl from "yauzl";
import type { Entry, ZipFile } from "yauzl";

const MAX_ENTRIES = 1_000;
const MAX_TOTAL_UNCOMPRESSED = 50 * 1024 * 1024;
const MAX_ENTRY_UNCOMPRESSED = 10 * 1024 * 1024;
const MAX_COMPRESSION_RATIO = 100;

const REQUIRED_ENTRIES = ["[Content_Types].xml", "word/document.xml"];

export class InvalidDocxError extends Error {
  constructor(message = "The DOCX archive is invalid or exceeds safety limits.") {
    super(message);
    this.name = "InvalidDocxError";
  }
}

export async function validateDocxArchive(buffer: Buffer): Promise<void> {
  const zip = await new Promise<ZipFile>((resolve, reject) => {
    yauzl.fromBuffer(
      buffer,
      {
        lazyEntries: true,
        decodeStrings: true,
        validateEntrySizes: true,
        strictFileNames: true,
      },
      (error, archive) => {
        if (error || !archive) {
          reject(new InvalidDocxError("The DOCX ZIP structure is invalid."));
          return;
        }
        resolve(archive);
      },
    );
  });

  try {
    await new Promise<void>((resolve, reject) => {
      const names = new Set<string>();
      const canonicalNames = new Set<string>();
      let entryCount = 0;
      let totalUncompressed = 0;
      let finished = false;

      const fail = (message: string) => {
        if (finished) return;
        finished = true;
        reject(new InvalidDocxError(message));
      };

      const next = () => {
        if (!finished) zip.readEntry();
      };

      zip.on("error", () => {
        fail("The DOCX archive could not be read.");
      });

      zip.on("end", () => {
        if (finished) return;
        const missing = REQUIRED_ENTRIES.filter((name) => !names.has(name));
        if (missing.length > 0) {
          fail("Required DOCX components are missing.");
          return;
        }
        finished = true;
        resolve();
      });

      zip.on("entry", (entry: Entry) => {
        if (finished) return;
        entryCount += 1;

        if (entryCount > MAX_ENTRIES) {
          fail("The DOCX contains too many archive entries.");
          return;
        }

        const name = entry.fileName;
        const normalized = name.replace(/\\/gu, "/");
        const isDirectory = normalized.endsWith("/");
        const parts = normalized.split("/");
        const canonicalName = normalized.toLowerCase();

        if (
          !name ||
          normalized.startsWith("/") ||
          /^[a-zA-Z]:/u.test(normalized) ||
          parts.some((part) => part === "..") ||
          name.includes("\0") ||
          canonicalNames.has(canonicalName)
        ) {
          fail("The DOCX contains an unsafe or duplicate archive path.");
          return;
        }

        canonicalNames.add(canonicalName);
        names.add(normalized);

        if (isDirectory) {
          if (entry.uncompressedSize !== 0 || entry.compressedSize !== 0) {
            fail("A DOCX directory entry contains unexpected data.");
            return;
          }
          next();
          return;
        }

        if (
          !Number.isSafeInteger(entry.uncompressedSize) ||
          !Number.isSafeInteger(entry.compressedSize) ||
          entry.uncompressedSize < 0 ||
          entry.compressedSize < 0
        ) {
          fail("The DOCX contains invalid archive sizes.");
          return;
        }

        if (entry.uncompressedSize > MAX_ENTRY_UNCOMPRESSED) {
          fail("A DOCX archive entry is too large.");
          return;
        }

        totalUncompressed += entry.uncompressedSize;
        if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED) {
          fail("The DOCX expands beyond the permitted total size.");
          return;
        }

        if (entry.uncompressedSize > 0) {
          if (entry.compressedSize === 0) {
            fail("The DOCX contains an invalid compressed size.");
            return;
          }
          if (entry.uncompressedSize / entry.compressedSize > MAX_COMPRESSION_RATIO) {
            fail("The DOCX compression ratio exceeds the permitted limit.");
            return;
          }
        }

        zip.openReadStream(entry, (error, stream) => {
          if (finished) {
            stream?.destroy();
            return;
          }
          if (error || !stream) {
            fail("A DOCX archive entry could not be opened.");
            return;
          }

          let actualSize = 0;

          stream.on("data", (chunk: Buffer) => {
            if (finished) {
              stream.destroy();
              return;
            }
            actualSize += chunk.length;
            if (
              actualSize > MAX_ENTRY_UNCOMPRESSED ||
              actualSize > entry.uncompressedSize
            ) {
              stream.destroy();
              fail("A DOCX archive entry exceeded its declared size.");
            }
          });

          stream.on("error", () => {
            fail("A DOCX archive entry could not be read completely.");
          });

          stream.on("end", () => {
            if (finished) return;
            if (actualSize !== entry.uncompressedSize) {
              fail("A DOCX archive entry has an inconsistent size.");
              return;
            }
            next();
          });
        });
      });

      zip.readEntry();
    });
  } finally {
    zip.close();
  }
}