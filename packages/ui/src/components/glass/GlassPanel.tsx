import { styled, YStack } from 'tamagui'
import { glassShadows } from './glass-shadows'

export const GlassPanel = styled(YStack, {
  name: 'GlassPanel',

  backgroundColor: '$surface0',
  borderColor: '$strokeSubtle',
  borderWidth: 1,
  borderRadius: '$2xl',
  overflow: 'hidden',

  padding: '$6',

  // Native shadow
  shadowColor: glassShadows.panel.native.shadowColor,
  shadowOpacity: glassShadows.panel.native.shadowOpacity,
  shadowRadius: glassShadows.panel.native.shadowRadius,
  shadowOffset: glassShadows.panel.native.shadowOffset,

  // Web shadow + blur
  web: {
    backdropFilter: 'blur(18px)',
    backgroundColor: 'rgba(26, 28, 36, 0.72)',
    boxShadow: glassShadows.panel.web.boxShadow
  },

  variants: {
    padded: {
      true: { padding: '$6' },
      false: { padding: 0 }
    }
  } as const,

  defaultVariants: {
    padded: true
  }
})


