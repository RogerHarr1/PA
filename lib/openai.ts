import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EditImageParams {
  imageBuffer: Buffer;
  prompt: string;
  maskBuffer?: Buffer;
}

interface EditImageResult {
  buffer: Buffer;
  promptUsed: string;
}

/**
 * Edits an image using OpenAI's gpt-image-1 model
 * @param imageBuffer - PNG image buffer to edit
 * @param prompt - Text description of desired edits
 * @param maskBuffer - Optional PNG mask buffer (transparent areas will be edited)
 * @returns Buffer containing the edited image
 */
export async function editImage({
  imageBuffer,
  prompt,
  maskBuffer,
}: EditImageParams): Promise<EditImageResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      action: 'openai_edit_start',
      promptLength: prompt.length,
      imageSize: imageBuffer.length,
      hasMask: !!maskBuffer,
    })
  );

  try {
    // Convert buffer to File object for the API
    const imageFile = new File([imageBuffer], 'image.png', {
      type: 'image/png',
    });

    const params: OpenAI.ImageEditParams = {
      model: 'dall-e-2', // Note: gpt-image-1 is not available, using dall-e-2
      image: imageFile,
      prompt: prompt.slice(0, 1000), // Limit prompt length
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    };

    // Add mask if provided
    if (maskBuffer) {
      const maskFile = new File([maskBuffer], 'mask.png', {
        type: 'image/png',
      });
      params.mask = maskFile;
    }

    const response = await openai.images.edit(params);

    if (!response.data || response.data.length === 0) {
      throw new Error('No image data returned from OpenAI');
    }

    const b64Image = response.data[0].b64_json;
    if (!b64Image) {
      throw new Error('No base64 image data in response');
    }

    const buffer = Buffer.from(b64Image, 'base64');

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'openai_edit_success',
        resultSize: buffer.length,
      })
    );

    return {
      buffer,
      promptUsed: prompt.slice(0, 1000),
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'openai_edit_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    );
    throw error;
  }
}
