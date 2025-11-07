import { NextRequest, NextResponse } from 'next/server';
import { processImageForEdit, validateImageType } from '@/lib/imageUtils';
import { editImage } from '@/lib/openai';
import { uploadToBlob } from '@/lib/azureBlob';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';
import { getEditPrompt } from '@/lib/presets';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for OpenAI processing

interface EditResponse {
  success: boolean;
  blobUrl?: string;
  filename?: string;
  promptUsed?: string;
  bytes?: number;
  error?: string;
  rateLimitReset?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(clientId);

    if (!rateLimitResult.allowed) {
      const response: EditResponse = {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        rateLimitReset: rateLimitResult.resetTime,
      };

      return NextResponse.json(response, {
        status: 429,
        headers: {
          'X-RateLimit-Limit': process.env.RATE_LIMIT_MAX_REQUESTS || '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          'Retry-After': Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000
          ).toString(),
        },
      });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const presetId = formData.get('preset') as string;
    const customPrompt = formData.get('customPrompt') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!presetId) {
      return NextResponse.json(
        { success: false, error: 'No preset selected' },
        { status: 400 }
      );
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'edit_request_start',
        clientId,
        preset: presetId,
        hasCustomPrompt: !!customPrompt,
        filename: file.name,
        fileSize: file.size,
      })
    );

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file type
    if (!validateImageType(buffer)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, and WebP are supported.',
        },
        { status: 400 }
      );
    }

    // Process and resize image
    const processedImage = await processImageForEdit(buffer);

    // Get the prompt to use
    const prompt = getEditPrompt(
      presetId,
      customPrompt || undefined
    );

    // Call OpenAI to edit the image
    const editResult = await editImage({
      imageBuffer: processedImage.buffer,
      prompt,
    });

    // Upload to Azure Blob Storage
    const uploadResult = await uploadToBlob(
      editResult.buffer,
      'image/png',
      {
        preset: presetId,
        prompt: editResult.promptUsed,
        originalFilename: file.name,
        timestamp: new Date().toISOString(),
      }
    );

    const duration = Date.now() - startTime;

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'edit_request_complete',
        duration,
        filename: uploadResult.filename,
        bytes: uploadResult.bytes,
      })
    );

    const response: EditResponse = {
      success: true,
      blobUrl: uploadResult.blobUrl,
      filename: uploadResult.filename,
      promptUsed: editResult.promptUsed,
      bytes: uploadResult.bytes,
    };

    return NextResponse.json(response, {
      headers: {
        'X-RateLimit-Limit': process.env.RATE_LIMIT_MAX_REQUESTS || '5',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'edit_request_error',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
    );

    // Return user-friendly error
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred. Please try again.';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
