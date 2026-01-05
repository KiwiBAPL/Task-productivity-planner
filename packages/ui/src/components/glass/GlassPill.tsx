import { styled, XStack } from 'tamagui'
import { glassShadows } from './glass-shadows'

export const GlassPill = styled(XStack, {
  name: 'GlassPill',

  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  borderColor: 'rgba(255, 255, 255, 0.10)',
  borderWidth: 1,
  borderRadius: '$pill',

  alignItems: 'center',
  gap: '$3',

  paddingHorizontal: '$5',
  height: 40,

  shadowColor: glassShadows.control.native.shadowColor,
  shadowOpacity: glassShadows.control.native.shadowOpacity,
  shadowRadius: glassShadows.control.native.shadowRadius,
  shadowOffset: glassShadows.control.native.shadowOffset,

  web: {
    backdropFilter: 'blur(10px)',
    boxShadow: glassShadows.control.web.boxShadow
  },

  variants: {
    size: {
      sm: { height: 36, paddingHorizontal: '$4' },
      md: { height: 40, paddingHorizontal: '$5' },
      lg: { height: 48, paddingHorizontal: '$6' }
    }
  } as const,

  defaultVariants: {
    size: 'md'
  }
})


