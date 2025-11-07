'use client';

import { useState } from 'react';
import ImagePicker from '@/components/ImagePicker';
import PresetSelect from '@/components/PresetSelect';
import ResultCard from '@/components/ResultCard';

interface EditResult {
  blobUrl: string;
  filename: string;
  promptUsed: string;
  bytes: number;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [result, setResult] = useState<EditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelected = (file: File, url: string) => {
    setSelectedFile(file);
    setPreviewUrl(url);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !selectedPreset) {
      setError('Please select an image and a preset');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress('Uploading image...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('preset', selectedPreset);
      if (customPrompt.trim()) {
        formData.append('customPrompt', customPrompt.trim());
      }

      setProgress('Processing with AI...');

      const response = await fetch('/api/edit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Edit failed');
      }

      setProgress('Saving to storage...');

      // Small delay to show the final progress state
      await new Promise((resolve) => setTimeout(resolve, 500));

      setResult({
        blobUrl: data.blobUrl,
        filename: data.filename,
        promptUsed: data.promptUsed,
        bytes: data.bytes,
      });

      setProgress('');
    } catch (err) {
      console.error('Edit error:', err);
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
      setProgress('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedPreset('');
    setCustomPrompt('');
    setResult(null);
    setError(null);
    setProgress('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Image Editor
          </h1>
          <p className="text-gray-600">
            Transform your photos with AI-powered editing presets
          </p>
        </div>

        <div className="space-y-6">
          {/* Image Upload Section */}
          {!selectedFile && !result && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <ImagePicker
                onImageSelected={handleImageSelected}
                disabled={isProcessing}
              />
            </div>
          )}

          {/* Preview and Edit Section */}
          {selectedFile && previewUrl && !result && (
            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Selected Image
                </h2>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden max-h-96">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>

              <PresetSelect
                selectedPreset={selectedPreset}
                onPresetChange={setSelectedPreset}
                customPrompt={customPrompt}
                onCustomPromptChange={setCustomPrompt}
                disabled={isProcessing}
              />

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <svg
                      className="h-5 w-5 text-red-400 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error
                      </h3>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Display */}
              {isProcessing && progress && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                    <p className="ml-3 text-sm font-medium text-primary-900">
                      {progress}
                    </p>
                  </div>
                  <div className="mt-3 bg-primary-200 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-primary-600 animate-pulse w-full"></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || !selectedPreset}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Apply AI Edit
                    </>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="sm:flex-none inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Result Section */}
          {result && (
            <>
              <ResultCard
                blobUrl={result.blobUrl}
                filename={result.filename}
                promptUsed={result.promptUsed}
                bytes={result.bytes}
              />

              <div className="text-center">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Edit Another Image
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Powered by OpenAI • Stored on Azure Blob Storage
          </p>
          <p className="mt-1">
            Install this app for the best experience
          </p>
        </div>
      </div>
    </div>
  );
}
