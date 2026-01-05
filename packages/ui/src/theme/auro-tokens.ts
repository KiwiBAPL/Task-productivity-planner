import { createTokens } from 'tamagui'

export const auroTokens = createTokens({
  color: {
    // Neutrals
    bg0: '#0B0C10',
    bg1: '#0F1118',

    surface0: 'rgba(26, 28, 36, 0.72)',
    surface1: 'rgba(35, 38, 51, 0.74)',
    surface2: 'rgba(44, 48, 64, 0.78)',

    strokeSubtle: 'rgba(255, 255, 255, 0.08)',
    strokeStrong: 'rgba(255, 255, 255, 0.14)',
    divider: 'rgba(255, 255, 255, 0.06)',

    // Text
    textPrimary: '#F4F6FF',
    textSecondary: 'rgba(244, 246, 255, 0.72)',
    textTertiary: 'rgba(244, 246, 255, 0.52)',
    textDisabled: 'rgba(244, 246, 255, 0.34)',
    textInverse: '#0B0C10',

    // Accent
    accent: '#8B5CF6',
    accentSoft: 'rgba(139, 92, 246, 0.22)',
    accentGlow: 'rgba(139, 92, 246, 0.35)',

    // Semantic (sparingly)
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#FB7185',
    info: '#60A5FA'
  },
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    10: 40,
    12: 48,
    14: 56,
    16: 64
  },
  radius: {
    0: 0,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    '2xl': 32,
    pill: 999
  },
  size: {
    0: 0,
    1: 16,
    2: 20,
    3: 24,
    4: 28,
    5: 32,
    6: 36,
    7: 40,
    8: 44,
    9: 48,
    10: 56
  },
  zIndex: {
    0: 0,
    1: 10,
    2: 20,
    3: 30,
    4: 40,
    5: 50
  }
})


