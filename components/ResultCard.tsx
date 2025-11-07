"use client";

interface ResultCardProps {
  result: {
    blobUrl: string;
    filename: string;
    promptUsed: string;
    bytes: number;
  };
}

export default function ResultCard({ result }: ResultCardProps) {
  const sizeInKB = (result.bytes / 1024).toFixed(1);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Edited Image</h2>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <img
          src={result.blobUrl}
          alt="Edited result"
          className="w-full h-auto"
          loading="lazy"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Size:</span>
          <span className="font-medium text-gray-900">{sizeInKB} KB</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Filename:</span>
          <span className="font-mono text-xs text-gray-900 truncate max-w-xs">
            {result.filename}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs text-gray-500 mb-2">Prompt used:</p>
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
          {result.promptUsed}
        </p>
      </div>

      <div className="flex gap-3">
        <a
          href={result.blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
        >
          Open in Blob Storage
        </a>
        <button
          onClick={() => {
            const link = document.createElement("a");
            link.href = result.blobUrl;
            link.download = result.filename;
            link.click();
          }}
          className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Download
        </button>
      </div>
    </div>
  );
}
