export const colors = {
  primary: '#FF6B00',
  navy: '#0D1B2A',
  softWhite: '#F8F9FA',
  cardWhite: '#FFFFFF',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  muted: '#9CA3AF',
  lightGray: '#F3F4F6',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
} as const;

export type ColorKey = keyof typeof colors;
