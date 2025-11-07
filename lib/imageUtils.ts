import sharp from "sharp";

const MAX_DIMENSION = 2048;
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate image file type and size
 * @param file - File object or buffer
 * @param filename - Original filename
 * @returns Validation result
 */
export function validateImage(file: Buffer, filename: string): ImageValidationResult {
  // Check file size
  if (file.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file extension (basic check)
  const ext = filename.toLowerCase().split(".").pop();
  const allowedExtensions = ["jpg", "jpeg", "png", "webp"];

  if (!ext || !allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: "Invalid file type. Allowed: JPEG, PNG, WebP",
    };
  }

  // Reject SVG explicitly
  if (ext === "svg") {
    return {
      valid: false,
      error: "SVG files are not supported for security reasons",
    };
  }

  return { valid: true };
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
}

/**
 * Process and resize image if needed
 * Converts to PNG and ensures dimensions are within limits
 * @param inputBuffer - Raw image buffer
 * @returns Processed image data
 */
export async function processImage(inputBuffer: Buffer): Promise<ProcessedImage> {
  try {
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    console.info(
      JSON.stringify({
        event: "image_process_start",
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        originalFormat: metadata.format,
        originalSize: inputBuffer.length,
      })
    );

    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const maxDim = Math.max(width, height);

    let processedImage = image;

    // Resize if too large
    if (maxDim > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / maxDim;
      const newWidth = Math.round(width * scale);
      const newHeight = Math.round(height * scale);

      processedImage = processedImage.resize(newWidth, newHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });

      console.info(
        JSON.stringify({
          event: "image_resized",
          newWidth,
          newHeight,
        })
      );
    }

    // Convert to PNG for OpenAI compatibility
    const buffer = await processedImage.png({ quality: 100 }).toBuffer();
    const finalMetadata = await sharp(buffer).metadata();

    console.info(
      JSON.stringify({
        event: "image_process_complete",
        finalWidth: finalMetadata.width,
        finalHeight: finalMetadata.height,
        finalSize: buffer.length,
      })
    );

    return {
      buffer,
      width: finalMetadata.width || 0,
      height: finalMetadata.height || 0,
      format: "png",
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "image_process_error",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    );
    throw new Error("Failed to process image");
  }
}

/**
 * Check if buffer is a valid image by trying to parse it
 * @param buffer - Image buffer
 * @returns True if valid image
 */
export async function isValidImageBuffer(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    return !!(metadata.width && metadata.height);
  } catch {
    return false;
  }
}
