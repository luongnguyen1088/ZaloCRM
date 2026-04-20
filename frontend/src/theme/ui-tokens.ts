export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const safe = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  const value = Number.parseInt(safe, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const chartTokens = {
  light: {
    cardSurface: 'rgba(255, 255, 255, 0.82)',
    cardBorder: 'rgba(148, 163, 184, 0.24)',
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    tooltipBg: '#0F172A',
    tooltipText: '#FFFFFF',
    grid: 'rgba(148, 163, 184, 0.16)',
    sent: '#2563EB',
    received: '#7C3AED',
    neutral: '#94A3B8',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  },
  dark: {
    cardSurface: 'rgba(19, 32, 59, 0.82)',
    cardBorder: 'rgba(148, 163, 184, 0.18)',
    text: '#E2E8F0',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    tooltipBg: '#020617',
    tooltipText: '#E2E8F0',
    grid: 'rgba(148, 163, 184, 0.12)',
    sent: '#60A5FA',
    received: '#A78BFA',
    neutral: '#94A3B8',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    info: '#38BDF8',
  },
} as const;

export const sourceBrandColors = {
  FB: '#1877F2',
  TT: '#000000',
  GT: '#FF6F00',
  CN: '#10B981',
} as const;
