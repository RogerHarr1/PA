"use client";

import { getAllPresets } from "@/lib/presets";

interface PresetSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function PresetSelect({ value, onChange, disabled }: PresetSelectProps) {
  const presets = getAllPresets();

  return (
    <div>
      <label htmlFor="preset" className="block text-sm font-medium text-gray-700 mb-2">
        Select Edit Style
      </label>
      <select
        id="preset"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
      >
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
      <p className="text-sm text-gray-500 mt-2">
        {presets.find((p) => p.id === value)?.description}
      </p>
    </div>
  );
}
