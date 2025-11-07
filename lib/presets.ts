/**
 * AI edit presets configuration
 * TO ADD NEW PRESETS: Add new entries to this object
 */

export interface Preset {
  id: string;
  label: string;
  prompt: string;
  description: string;
}

export const PRESETS: Record<string, Preset> = {
  "remove-bg": {
    id: "remove-bg",
    label: "Remove Background",
    prompt: "Remove the background completely, keep subject centered with soft shadow on transparent background",
    description: "Isolate the main subject with a clean transparent background",
  },
  "enhance": {
    id: "enhance",
    label: "Enhance Quality",
    prompt: "Enhance contrast and sharpness, reduce noise, keep colors natural and balanced",
    description: "Improve overall image quality and clarity",
  },
  "color-pop": {
    id: "color-pop",
    label: "Color Pop",
    prompt: "Slightly increase vibrance and saturation, make colors more vivid while keeping skin tones natural",
    description: "Make colors more vibrant and eye-catching",
  },
  "portrait": {
    id: "portrait",
    label: "Portrait Cleanup",
    prompt: "Smooth skin texture subtly, enhance eyes, improve lighting on face, keep natural look",
    description: "Subtle portrait enhancements for better photos",
  },
  "black-white": {
    id: "black-white",
    label: "Black & White",
    prompt: "Convert to high contrast black and white with rich tones and deep shadows",
    description: "Classic monochrome conversion",
  },
  "vintage": {
    id: "vintage",
    label: "Vintage Film",
    prompt: "Apply vintage film look with warm tones, slight grain, and faded colors",
    description: "Nostalgic film-like appearance",
  },
};

/**
 * Get preset by ID
 * @param id - Preset identifier
 * @returns Preset object or undefined
 */
export function getPreset(id: string): Preset | undefined {
  return PRESETS[id];
}

/**
 * Get all available presets as array
 * @returns Array of all presets
 */
export function getAllPresets(): Preset[] {
  return Object.values(PRESETS);
}

/**
 * Validate preset ID
 * @param id - Preset identifier to validate
 * @returns True if valid preset
 */
export function isValidPreset(id: string): boolean {
  return id in PRESETS;
}
