interface ShadowPreset {
  native: {
    shadowColor: string
    shadowOpacity: number
    shadowRadius: number
    shadowOffset: { width: number; height: number }
  }
  web: {
    boxShadow: string
  }
}

export const glassShadows: Record<'panel' | 'card' | 'control' | 'accentGlow', ShadowPreset> = {
  panel: {
    native: {
      shadowColor: 'rgba(0,0,0,0.55)',
      shadowOpacity: 1,
      shadowRadius: 60,
      shadowOffset: { width: 0, height: 20 }
    },
    web: {
      boxShadow: '0px 20px 60px -20px rgba(0,0,0,0.55), inset 0px 2px 0px rgba(255,255,255,0.04)'
    }
  },
  card: {
    native: {
      shadowColor: 'rgba(0,0,0,0.55)',
      shadowOpacity: 1,
      shadowRadius: 40,
      shadowOffset: { width: 0, height: 14 }
    },
    web: {
      boxShadow: '0px 14px 40px -18px rgba(0,0,0,0.55), inset 0px 1px 0px rgba(255,255,255,0.05)'
    }
  },
  control: {
    native: {
      shadowColor: 'rgba(0,0,0,0.55)',
      shadowOpacity: 1,
      shadowRadius: 26,
      shadowOffset: { width: 0, height: 10 }
    },
    web: {
      boxShadow: '0px 10px 26px -16px rgba(0,0,0,0.55), inset 0px 1px 0px rgba(255,255,255,0.06)'
    }
  },
  accentGlow: {
    native: {
      shadowColor: 'rgba(139,92,246,0.30)',
      shadowOpacity: 1,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 0 }
    },
    web: {
      boxShadow: '0px 0px 22px 0px rgba(139,92,246,0.30)'
    }
  }
}


