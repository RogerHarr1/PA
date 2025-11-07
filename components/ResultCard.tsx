'use client';

import { useState } from 'react';

interface ResultCardProps {
  blobUrl: string;
  filename: string;
  promptUsed: string;
  bytes: number;
}

export default function ResultCard({
  blobUrl,
  filename,
  promptUsed,
  bytes,
}: ResultCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          ✓ Edit Complete
        </h3>
        <span className="text-sm text-gray-500">{formatBytes(bytes)}</span>
      </div>

      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}
        <img
          src={blobUrl}
          alt="Edited result"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-auto transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">
            Applied Edit
          </p>
          <p className="text-sm text-gray-700 mt-1">{promptUsed}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">
            Storage Path
          </p>
          <p className="text-xs text-gray-600 font-mono mt-1 break-all">
            {filename}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <a
          href={blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Open in New Tab
        </a>

        <a
          href={blobUrl}
          download={filename.split('/').pop()}
          className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </a>
      </div>
    </div>
  );
}
