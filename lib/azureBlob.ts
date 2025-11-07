import { BlobServiceClient, ContainerClient, BlockBlobClient } from "@azure/storage-blob";
import { randomUUID } from "crypto";

let containerClient: ContainerClient | null = null;

/**
 * Get or create Azure Blob container client
 */
function getContainerClient(): ContainerClient {
  if (containerClient) return containerClient;

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER || "edited-images";

  if (!connectionString) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING is not configured");
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  containerClient = blobServiceClient.getContainerClient(containerName);

  return containerClient;
}

/**
 * Generate a unique blob name with date-based folder structure
 * @param extension - File extension (e.g., 'png', 'jpg')
 * @returns Blob name in format: YYYY/MM/DD/uuid.ext
 */
export function generateBlobName(extension: string = "png"): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const uuid = randomUUID();

  return `${year}/${month}/${day}/${uuid}.${extension}`;
}

export interface UploadResult {
  blobUrl: string;
  filename: string;
  bytes: number;
}

/**
 * Upload image buffer to Azure Blob Storage
 * @param imageBuffer - Image data to upload
 * @param contentType - MIME type of the image
 * @param filename - Optional custom filename (generates one if not provided)
 * @returns Upload result with blob URL and metadata
 */
export async function uploadToBlob(
  imageBuffer: Buffer,
  contentType: string = "image/png",
  filename?: string
): Promise<UploadResult> {
  try {
    const container = getContainerClient();
    const blobName = filename || generateBlobName("png");
    const blockBlobClient: BlockBlobClient = container.getBlockBlobClient(blobName);

    console.info(
      JSON.stringify({
        event: "azure_upload_start",
        blobName,
        bytes: imageBuffer.length,
        contentType,
      })
    );

    // Upload the buffer
    await blockBlobClient.uploadData(imageBuffer, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: "public, max-age=31536000", // Cache for 1 year
      },
    });

    const blobUrl = blockBlobClient.url;

    console.info(
      JSON.stringify({
        event: "azure_upload_complete",
        blobUrl,
        blobName,
      })
    );

    return {
      blobUrl,
      filename: blobName,
      bytes: imageBuffer.length,
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "azure_upload_error",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      })
    );
    throw error;
  }
}

/**
 * Optional: Create container if it doesn't exist
 * Call this during app initialization if needed
 */
export async function ensureContainerExists(): Promise<void> {
  try {
    const container = getContainerClient();
    const exists = await container.exists();

    if (!exists) {
      await container.create({
        access: "blob", // Allow public read access to blobs
      });
      console.info(JSON.stringify({ event: "azure_container_created" }));
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "azure_container_check_error",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    );
  }
}
