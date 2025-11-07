'use client';

import { useState } from 'react';
import { PRESETS, Preset } from '@/lib/presets';

interface PresetSelectProps {
  selectedPreset: string;
  onPresetChange: (presetId: string) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  disabled?: boolean;
}

export default function PresetSelect({
  selectedPreset,
  onPresetChange,
  customPrompt,
  onCustomPromptChange,
  disabled,
}: PresetSelectProps) {
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="preset"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Choose Edit Style
        </label>
        <select
          id="preset"
          value={selectedPreset}
          onChange={(e) => onPresetChange(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-base"
        >
          <option value="">Select a preset...</option>
          {PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>

        {selectedPreset && !showCustomPrompt && (
          <p className="text-sm text-gray-500 mt-2">
            {PRESETS.find((p) => p.id === selectedPreset)?.description}
          </p>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowCustomPrompt(!showCustomPrompt)}
          disabled={disabled}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
        >
          {showCustomPrompt ? '− Hide' : '+ Add'} Custom Instructions
        </button>

        {showCustomPrompt && (
          <div className="mt-3">
            <label
              htmlFor="customPrompt"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Custom Prompt (optional)
            </label>
            <textarea
              id="customPrompt"
              value={customPrompt}
              onChange={(e) => onCustomPromptChange(e.target.value)}
              disabled={disabled}
              placeholder="Describe your desired edits in detail..."
              rows={3}
              maxLength={1000}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-base resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {customPrompt.length}/1000 characters
              {customPrompt.trim() && ' • Will override preset'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
