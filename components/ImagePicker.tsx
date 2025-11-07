"use client";

import { useRef, ChangeEvent } from "react";

interface ImagePickerProps {
  onImageSelected: (file: File, previewUrl: string) => void;
  previewUrl?: string;
}

export default function ImagePicker({ onImageSelected, previewUrl }: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, or WebP)");
      return;
    }

    // Client-side downscale using canvas
    const downscaledFile = await downscaleImage(file);
    const preview = URL.createObjectURL(downscaledFile);
    onImageSelected(downscaledFile, preview);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        {previewUrl ? (
          <div className="space-y-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full h-auto max-h-96 mx-auto rounded-lg shadow-md"
            />
            <button
              type="button"
              onClick={handleClick}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Change Image
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-gray-600">
              <button
                type="button"
                onClick={handleClick}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
              >
                Choose or Capture Photo
              </button>
              <p className="mt-2 text-sm text-gray-500">PNG, JPG, WebP up to 8MB</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

/**
 * Downscale image to max 2048px dimension using canvas
 * Reduces file size before upload to control costs and latency
 */
async function downscaleImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const MAX_DIMENSION = 2048;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      let { width, height } = img;
      const maxDim = Math.max(width, height);

      // Only downscale if larger than max dimension
      if (maxDim > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / maxDim;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with quality compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // Create new file from blob
          const downscaledFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          console.info("Image downscaled:", {
            original: file.size,
            downscaled: downscaledFile.size,
            dimensions: `${width}x${height}`,
          });

          resolve(downscaledFile);
        },
        "image/jpeg",
        0.85
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}
