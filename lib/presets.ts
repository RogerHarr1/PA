/**
 * Pre-defined image editing presets
 * Each preset contains a prompt optimized for OpenAI image editing
 */

export interface Preset {
  id: string;
  label: string;
  prompt: string;
  description: string;
}

export const PRESETS: Preset[] = [
  {
    id: 'remove-bg',
    label: 'Remove Background',
    prompt:
      'Remove the background completely, keep the main subject centered with a soft subtle shadow, transparent background',
    description: 'Removes background, keeps subject with soft shadow',
  },
  {
    id: 'enhance',
    label: 'Enhance Quality',
    prompt:
      'Enhance image contrast and sharpness, reduce noise, keep all colors natural and realistic, professional photo quality',
    description: 'Improves contrast, reduces noise, natural colors',
  },
  {
    id: 'color-pop',
    label: 'Color Pop',
    prompt:
      'Slightly increase color vibrancy and saturation, keep skin tones natural and realistic, enhance color depth without oversaturation',
    description: 'Boosts colors while keeping skin tones natural',
  },
  {
    id: 'portrait-cleanup',
    label: 'Portrait Cleanup',
    prompt:
      'Clean up portrait photo, smooth skin naturally, reduce blemishes, enhance facial features subtly, keep realistic appearance',
    description: 'Subtle portrait enhancement with natural skin',
  },
  {
    id: 'vintage',
    label: 'Vintage Effect',
    prompt:
      'Apply subtle vintage film effect, warm tones, slight grain, nostalgic feel, maintain image clarity',
    description: 'Warm vintage look with film grain',
  },
  {
    id: 'sharpen',
    label: 'Sharpen Details',
    prompt:
      'Sharpen image details and edges, enhance clarity and definition, maintain natural appearance without artifacts',
    description: 'Enhances sharpness and detail clarity',
  },
];

/**
 * Get a preset by ID
 */
export function getPresetById(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

/**
 * Validate and sanitize a custom prompt
 */
export function sanitizePrompt(prompt: string): string {
  return prompt.trim().slice(0, 1000); // Max 1000 characters
}

/**
 * Get the prompt to use for editing
 * Prefers custom prompt if provided, otherwise uses preset
 */
export function getEditPrompt(
  presetId: string,
  customPrompt?: string
): string {
  if (customPrompt && customPrompt.trim()) {
    return sanitizePrompt(customPrompt);
  }

  const preset = getPresetById(presetId);
  if (!preset) {
    throw new Error(`Invalid preset ID: ${presetId}`);
  }

  return preset.prompt;
}
