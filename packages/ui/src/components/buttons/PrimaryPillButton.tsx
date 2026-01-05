import { styled, Button } from 'tamagui'
import { glassShadows } from '../glass/glass-shadows'

export const PrimaryPillButton = styled(Button, {
  name: 'PrimaryPillButton',

  height: 44,
  paddingHorizontal: '$6',
  borderRadius: '$pill',

  backgroundColor: 'rgba(255,255,255,0.92)',
  color: '$textInverse',

  borderWidth: 0,

  shadowColor: glassShadows.control.native.shadowColor,
  shadowOpacity: glassShadows.control.native.shadowOpacity,
  shadowRadius: glassShadows.control.native.shadowRadius,
  shadowOffset: glassShadows.control.native.shadowOffset,

  pressStyle: {
    y: 1,
    backgroundColor: 'rgba(255,255,255,0.88)'
  },

  hoverStyle: {
    backgroundColor: 'rgba(255,255,255,1.0)'
  },

  focusStyle: {
    outlineColor: 'rgba(139,92,246,0.35)',
    outlineWidth: 1,
    outlineStyle: 'solid'
  },

  web: {
    boxShadow: glassShadows.control.web.boxShadow
  }
})


