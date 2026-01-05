import { styled, YStack } from 'tamagui'
import { glassShadows } from './glass-shadows'

export const GlassCard = styled(YStack, {
  name: 'GlassCard',

  backgroundColor: '$surface1',
  borderColor: '$strokeSubtle',
  borderWidth: 1,
  borderRadius: '$xl',
  overflow: 'hidden',

  padding: '$5',

  shadowColor: glassShadows.card.native.shadowColor,
  shadowOpacity: glassShadows.card.native.shadowOpacity,
  shadowRadius: glassShadows.card.native.shadowRadius,
  shadowOffset: glassShadows.card.native.shadowOffset,

  web: {
    backdropFilter: 'blur(14px)',
    backgroundColor: 'rgba(35, 38, 51, 0.74)',
    boxShadow: glassShadows.card.web.boxShadow
  },

  variants: {
    density: {
      normal: { padding: '$5' },
      dense: { padding: '$4', borderRadius: '$lg' }
    }
  } as const,

  defaultVariants: {
    density: 'normal'
  }
})


