"use client";

import { useState } from "react";
import ImagePicker from "@/components/ImagePicker";
import PresetSelect from "@/components/PresetSelect";
import ResultCard from "@/components/ResultCard";

interface EditResult {
  blobUrl: string;
  filename: string;
  promptUsed: string;
  bytes: number;
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [preset, setPreset] = useState<string>("remove-bg");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<EditResult | null>(null);

  const handleImageSelected = (file: File, preview: string) => {
    setSelectedImage(file);
    setPreviewUrl(preview);
    setResult(null);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }

    setIsProcessing(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedImage);
      formData.append("preset", preset);
      if (customPrompt.trim()) {
        formData.append("customPrompt", customPrompt.trim());
      }

      const response = await fetch("/api/edit", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image");
      console.error("Edit error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="text-center py-4">
        <h1 className="text-3xl font-bold text-gray-900">AI Image Editor</h1>
        <p className="text-gray-600 mt-2">Transform your photos with AI</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <ImagePicker onImageSelected={handleImageSelected} previewUrl={previewUrl} />

        <PresetSelect
          value={preset}
          onChange={setPreset}
          disabled={isProcessing}
        />

        <div>
          <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-2">
            Custom Prompt (optional)
          </label>
          <input
            type="text"
            id="customPrompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            disabled={isProcessing}
            placeholder="Override preset with your own prompt..."
            maxLength={500}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use the selected preset
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedImage || isProcessing}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </>
          ) : (
            "Edit Image"
          )}
        </button>
      </form>

      {result && <ResultCard result={result} />}
    </div>
  );
}
