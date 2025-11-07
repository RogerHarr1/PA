import { NextRequest, NextResponse } from "next/server";
import { editImage, sanitizePrompt } from "@/lib/openai";
import { uploadToBlob } from "@/lib/azureBlob";
import { checkRateLimit, getClientIdentifier } from "@/lib/rateLimit";
import { validateImage, processImage } from "@/lib/imageUtils";
import { getPreset, isValidPreset } from "@/lib/presets";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(clientId, {
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX || "5"),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
    });

    if (!rateLimitResult.allowed) {
      const resetInSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Too many requests. Try again in ${resetInSeconds} seconds.` },
        {
          status: 429,
          headers: {
            "Retry-After": String(resetInSeconds),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimitResult.resetTime),
          },
        }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const presetId = formData.get("preset") as string;
    const customPrompt = formData.get("customPrompt") as string | null;

    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!presetId || !isValidPreset(presetId)) {
      return NextResponse.json({ error: "Invalid preset selected" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Validate file
    const validation = validateImage(fileBuffer, file.name);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    console.info(
      JSON.stringify({
        event: "edit_request_start",
        clientId,
        filename: file.name,
        size: fileBuffer.length,
        preset: presetId,
        hasCustomPrompt: !!customPrompt,
      })
    );

    // Process image (resize if needed, convert to PNG)
    const processedImage = await processImage(fileBuffer);

    // Determine prompt to use
    let promptToUse: string;
    if (customPrompt && customPrompt.trim()) {
      promptToUse = sanitizePrompt(customPrompt, 500);
      console.info(JSON.stringify({ event: "using_custom_prompt" }));
    } else {
      const preset = getPreset(presetId);
      if (!preset) {
        return NextResponse.json({ error: "Preset not found" }, { status: 400 });
      }
      promptToUse = preset.prompt;
    }

    // Call OpenAI to edit image
    const editedImageBuffer = await editImage({
      imageBuffer: processedImage.buffer,
      prompt: promptToUse,
    });

    // Upload to Azure Blob Storage
    const uploadResult = await uploadToBlob(editedImageBuffer, "image/png");

    const duration = Date.now() - startTime;

    console.info(
      JSON.stringify({
        event: "edit_request_complete",
        duration,
        blobUrl: uploadResult.blobUrl,
      })
    );

    // Return result
    return NextResponse.json(
      {
        blobUrl: uploadResult.blobUrl,
        filename: uploadResult.filename,
        promptUsed: promptToUse,
        bytes: uploadResult.bytes,
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.resetTime),
        },
      }
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "edit_request_error",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      })
    );

    // Return user-friendly error
    const errorMessage =
      error instanceof Error
        ? error.message.includes("OpenAI")
          ? "AI service error. Please try again."
          : error.message.includes("Azure")
          ? "Storage service error. Please try again."
          : "Failed to process image. Please try again."
        : "An unexpected error occurred";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
