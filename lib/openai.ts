import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EditImageParams {
  imageBuffer: Buffer;
  prompt: string;
  maskBuffer?: Buffer;
}

/**
 * Edit an image using OpenAI's gpt-image-1 model
 * @param params - Image buffer and prompt for editing
 * @returns Buffer containing the edited image (PNG format)
 */
export async function editImage({
  imageBuffer,
  prompt,
  maskBuffer,
}: EditImageParams): Promise<Buffer> {
  try {
    console.info(
      JSON.stringify({
        event: "openai_edit_start",
        promptLength: prompt.length,
        imageSize: imageBuffer.length,
        hasMask: !!maskBuffer,
      })
    );

    // Convert buffer to File-like object
    const imageFile = new File([imageBuffer], "image.png", { type: "image/png" });

    const params: OpenAI.Images.ImageEditParams = {
      model: "dall-e-2", // Note: gpt-image-1 is not available, using dall-e-2 for edits
      image: imageFile,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    };

    // Add mask if provided
    if (maskBuffer) {
      const maskFile = new File([maskBuffer], "mask.png", { type: "image/png" });
      params.mask = maskFile;
    }

    const response = await openai.images.edit(params);

    if (!response.data || response.data.length === 0) {
      throw new Error("No image data returned from OpenAI");
    }

    const b64Json = response.data[0].b64_json;
    if (!b64Json) {
      throw new Error("No base64 image data in response");
    }

    const editedBuffer = Buffer.from(b64Json, "base64");

    console.info(
      JSON.stringify({
        event: "openai_edit_complete",
        resultSize: editedBuffer.length,
      })
    );

    return editedBuffer;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "openai_edit_error",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      })
    );
    throw error;
  }
}

/**
 * Validate and sanitize the edit prompt
 * @param prompt - User-provided prompt
 * @param maxLength - Maximum allowed length
 * @returns Sanitized prompt
 */
export function sanitizePrompt(prompt: string, maxLength: number = 500): string {
  return prompt.trim().slice(0, maxLength);
}
