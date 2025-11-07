import sharp from 'sharp';

const MAX_DIMENSION =
  parseInt(process.env.MAX_IMAGE_DIMENSION || '2048', 10) || 2048;
const MAX_SIZE_MB = parseInt(process.env.MAX_IMAGE_SIZE_MB || '8', 10) || 8;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface ProcessImageResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  originalSize: number;
  processedSize: number;
}

/**
 * Validates and processes an uploaded image
 * - Ensures it's a valid image format
 * - Resizes if too large
 * - Converts to PNG for OpenAI API compatibility
 */
export async function processImageForEdit(
  buffer: Buffer
): Promise<ProcessImageResult> {
  const originalSize = buffer.length;

  if (originalSize > MAX_SIZE_BYTES) {
    throw new Error(
      `Image too large: ${(originalSize / 1024 / 1024).toFixed(2)}MB (max ${MAX_SIZE_MB}MB)`
    );
  }

  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.format || !metadata.width || !metadata.height) {
      throw new Error('Invalid image file');
    }

    // Block SVG and other vector formats for security
    if (metadata.format === 'svg') {
      throw new Error('SVG files are not supported');
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'image_process_start',
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        originalSize,
      })
    );

    // Determine if resizing is needed
    const maxDim = Math.max(metadata.width, metadata.height);
    let processedImage = image;

    if (maxDim > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / maxDim;
      const newWidth = Math.round(metadata.width * scale);
      const newHeight = Math.round(metadata.height * scale);

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          action: 'image_resize',
          from: { width: metadata.width, height: metadata.height },
          to: { width: newWidth, height: newHeight },
        })
      );

      processedImage = image.resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to PNG with transparency support
    const processedBuffer = await processedImage
      .png({
        compressionLevel: 6,
        palette: false,
      })
      .toBuffer();

    const result: ProcessImageResult = {
      buffer: processedBuffer,
      format: 'png',
      width: metadata.width,
      height: metadata.height,
      originalSize,
      processedSize: processedBuffer.length,
    };

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'image_process_complete',
        originalSize,
        processedSize: processedBuffer.length,
        reduction: `${(((originalSize - processedBuffer.length) / originalSize) * 100).toFixed(1)}%`,
      })
    );

    return result;
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'image_process_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    );
    throw new Error(
      error instanceof Error ? error.message : 'Failed to process image'
    );
  }
}

/**
 * Validates file type from buffer
 */
export function validateImageType(buffer: Buffer): boolean {
  // Check magic bytes for common image formats
  const magicBytes = buffer.slice(0, 12);

  // PNG: 89 50 4E 47
  if (
    magicBytes[0] === 0x89 &&
    magicBytes[1] === 0x50 &&
    magicBytes[2] === 0x4e &&
    magicBytes[3] === 0x47
  ) {
    return true;
  }

  // JPEG: FF D8 FF
  if (
    magicBytes[0] === 0xff &&
    magicBytes[1] === 0xd8 &&
    magicBytes[2] === 0xff
  ) {
    return true;
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (
    magicBytes[0] === 0x52 &&
    magicBytes[1] === 0x49 &&
    magicBytes[2] === 0x46 &&
    magicBytes[3] === 0x46 &&
    magicBytes[8] === 0x57 &&
    magicBytes[9] === 0x45 &&
    magicBytes[10] === 0x42 &&
    magicBytes[11] === 0x50
  ) {
    return true;
  }

  return false;
}
