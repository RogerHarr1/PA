import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
} from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

let containerClient: ContainerClient | null = null;

/**
 * Get or create Azure Blob Container client
 */
function getContainerClient(): ContainerClient {
  if (containerClient) {
    return containerClient;
  }

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER || 'edited-images';

  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
  }

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  containerClient = blobServiceClient.getContainerClient(containerName);

  return containerClient;
}

interface UploadResult {
  blobUrl: string;
  filename: string;
  containerName: string;
  bytes: number;
}

/**
 * Upload a buffer to Azure Blob Storage
 * @param buffer - Image buffer to upload
 * @param contentType - MIME type (e.g., 'image/png')
 * @param metadata - Optional metadata to attach to the blob
 * @returns Upload result with blob URL and metadata
 */
export async function uploadToBlob(
  buffer: Buffer,
  contentType: string = 'image/png',
  metadata?: Record<string, string>
): Promise<UploadResult> {
  const client = getContainerClient();

  // Generate filename with date path: yyyy/mm/dd/uuid.ext
  const now = new Date();
  const datePath = now.toISOString().slice(0, 10).replace(/-/g, '/');
  const extension = contentType === 'image/jpeg' ? 'jpg' : 'png';
  const filename = `${datePath}/${uuidv4()}.${extension}`;

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      action: 'blob_upload_start',
      filename,
      bytes: buffer.length,
    })
  );

  try {
    const blockBlobClient: BlockBlobClient = client.getBlockBlobClient(filename);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: 'public, max-age=31536000', // 1 year cache
      },
      metadata,
    });

    const blobUrl = blockBlobClient.url;

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'blob_upload_success',
        filename,
        url: blobUrl,
      })
    );

    return {
      blobUrl,
      filename,
      containerName: client.containerName,
      bytes: buffer.length,
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'blob_upload_error',
        filename,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    );
    throw error;
  }
}

/**
 * Ensure the blob container exists (creates it if needed)
 * Should be called once during app initialization
 */
export async function ensureContainerExists(): Promise<void> {
  const client = getContainerClient();

  try {
    await client.createIfNotExists({
      access: 'blob', // Public read access for blobs
    });

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'container_ready',
        containerName: client.containerName,
      })
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'container_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    );
    throw error;
  }
}
