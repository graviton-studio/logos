import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { parse as csvParse } from "csv-parse/sync";
import pdf from "pdf-parse-new";

// Parse PDF files using pdf-parse-new library
async function parsePDF(buffer: ArrayBuffer): Promise<string> {
  try {
    const data = await pdf(Buffer.from(buffer));
    console.log(data.text);
    return data.text;
  } catch (error) {
    console.error("PDF parsing error:", error);
    return "[PDF FILE - Content extraction failed. Please convert to text format.]";
  }
}

const SUPPORTED_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/pdf",
  "application/json",
  "application/x-yaml",
  "text/yaml",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function processFileContent(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    return await parsePDF(arrayBuffer);
  }

  if (file.type === "text/csv") {
    const content = await file.text();
    try {
      const records = csvParse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      // Convert CSV to a readable format
      const headers = Object.keys(records[0] || {});
      let formatted = `CSV File: ${file.name}\n\n`;
      formatted += `Headers: ${headers.join(", ")}\n`;
      formatted += `Total Rows: ${records.length}\n\n`;

      // Show first few rows as preview
      const preview = records.slice(0, 5);
      formatted += "Preview (first 5 rows):\n";
      formatted += JSON.stringify(preview, null, 2);

      if (records.length > 5) {
        formatted += `\n\n... and ${records.length - 5} more rows`;
      }

      return formatted;
    } catch (error) {
      // Fallback to raw content if CSV parsing fails
      console.error("CSV parsing error:", error);
      return await file.text();
    }
  }

  // For all other text-based files
  return await file.text();
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const processedFiles = [];

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds maximum size of 10MB` },
          { status: 400 },
        );
      }

      // Validate file type
      if (!SUPPORTED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type "${file.type}" is not supported` },
          { status: 400 },
        );
      }

      try {
        const content = await processFileContent(file);
        processedFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          content: content,
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        return NextResponse.json(
          { error: `Failed to process file "${file.name}"` },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      files: processedFiles,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
