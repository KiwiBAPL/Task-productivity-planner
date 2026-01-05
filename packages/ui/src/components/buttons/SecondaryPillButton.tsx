import { styled, Button } from 'tamagui'
import { glassShadows } from '../glass/glass-shadows'

export const SecondaryPillButton = styled(Button, {
  name: 'SecondaryPillButton',

  height: 40,
  paddingHorizontal: '$5',
  borderRadius: '$pill',

  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  borderColor: 'rgba(255, 255, 255, 0.10)',
  borderWidth: 1,

  color: '$textPrimary',

  shadowColor: glassShadows.control.native.shadowColor,
  shadowOpacity: glassShadows.control.native.shadowOpacity,
  shadowRadius: glassShadows.control.native.shadowRadius,
  shadowOffset: glassShadows.control.native.shadowOffset,

  hoverStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.14)'
  },

  pressStyle: {
    y: 1
  },

  focusStyle: {
    outlineColor: 'rgba(139,92,246,0.35)',
    outlineWidth: 1,
    outlineStyle: 'solid'
  },

  web: {
    backdropFilter: 'blur(10px)',
    boxShadow: glassShadows.control.web.boxShadow
  }
})


