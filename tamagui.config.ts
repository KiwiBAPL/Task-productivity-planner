import { createFont, createTamagui } from 'tamagui'

import { auroThemes, auroTokens } from './packages/ui/src/theme'

// NOTE:
// - This config is intentionally dependency-light (no external font packages).
// - If you later add @tamagui/font-inter, you can swap these fonts to Inter.

const bodyFont = createFont({
  family:
    'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  size: {
    1: 12,
    2: 13,
    3: 14,
    4: 16,
    5: 20,
    6: 28,
    7: 40
  },
  lineHeight: {
    1: 14,
    2: 16,
    3: 20,
    4: 22,
    5: 28,
    6: 34,
    7: 44
  },
  weight: {
    4: '400',
    5: '500',
    6: '600'
  },
  letterSpacing: {
    4: 0,
    5: -0.2,
    6: -0.4,
    7: -0.6
  },
  face: {
    400: { normal: 'Inter' },
    500: { normal: 'Inter' },
    600: { normal: 'Inter' }
  }
})

const monoFont = createFont({
  family:
    'ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
  size: {
    1: 12,
    2: 13,
    3: 14,
    4: 16
  },
  lineHeight: {
    1: 14,
    2: 16,
    3: 20,
    4: 22
  },
  weight: {
    5: '500',
    6: '600'
  },
  letterSpacing: {
    4: 0
  }
})

const shorthands = {
  // spacing
  p: 'padding',
  px: 'paddingHorizontal',
  py: 'paddingVertical',
  pt: 'paddingTop',
  pr: 'paddingRight',
  pb: 'paddingBottom',
  pl: 'paddingLeft',
  m: 'margin',
  mx: 'marginHorizontal',
  my: 'marginVertical',
  mt: 'marginTop',
  mr: 'marginRight',
  mb: 'marginBottom',
  ml: 'marginLeft',

  // layout
  w: 'width',
  h: 'height',

  // flex
  fd: 'flexDirection',
  ai: 'alignItems',
  jc: 'justifyContent'
} as const

export const config = createTamagui({
  themes: auroThemes,
  tokens: auroTokens,
  fonts: {
    body: bodyFont,
    heading: bodyFont,
    mono: monoFont
  },
  shorthands,
  defaultTheme: 'auroDark',

  // Optional niceties (safe defaults)
  settings: {
    defaultFont: 'body',
    // Keep animations subtle; you can wire Tamagui animations later.
    disableSSR: false
  }
})

export type AppTamaguiConfig = typeof config

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}

export default config


