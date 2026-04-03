// Dark-first palette optimized for low-light stage environments

export const colors = {
  // Backgrounds
  bg: '#0a0a0a',
  bgSurface: '#141414',
  bgElevated: '#1e1e1e',
  bgModal: '#242424',

  // Text
  textPrimary: '#f0f0f0',
  textSecondary: '#a0a0a0',
  textMuted: '#606060',

  // Accent (teal)
  accent: '#0ea5e9',
  accentDim: '#0c4a6e',

  // State
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',

  // Borders
  border: '#2a2a2a',
  borderFocus: '#0ea5e9',

  // Player controls
  playButton: '#0ea5e9',
  playButtonActive: '#38bdf8',

  // Transport
  transportBg: '#1e1e1e',
  transportActive: '#0c4a6e',
} as const;

export type ColorKey = keyof typeof colors;
