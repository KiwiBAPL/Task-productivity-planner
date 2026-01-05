import React from 'react'

export interface PresetAvatarProps {
  className?: string
  size?: number
}

// Avatar identifiers
export type AvatarPreset = 
  | 'cat'
  | 'dog'
  | 'rabbit'
  | 'panda'
  | 'bear'
  | 'fox'
  | 'owl'
  | 'tiger'
  | 'lion'
  | 'elephant'
  | 'monkey'
  | 'penguin'
  | 'unicorn'
  | 'robot'
  | 'alien'

export const AVATAR_PRESETS: AvatarPreset[] = [
  'cat',
  'dog',
  'rabbit',
  'panda',
  'bear',
  'fox',
  'owl',
  'tiger',
  'lion',
  'elephant',
  'monkey',
  'penguin',
  'unicorn',
  'robot',
  'alien',
]

export const AvatarIcon: React.FC<PresetAvatarProps & { preset: AvatarPreset }> = ({ 
  preset, 
  className = '', 
  size = 64 
}) => {
  const icons: Record<AvatarPreset, JSX.Element> = {
    cat: (
      <svg viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="30" fill="#FF9F66" />
        <circle cx="24" cy="24" r="3" fill="#1A1A1A" />
        <circle cx="40" cy="24" r="3" fill="#1A1A1A" />
        <ellipse cx="32" cy="30" rx="3" ry="4" fill="#1A1A1A" />
        <path d="M24 36 Q32 40 40 36" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M20 20 Q22 18 24 20" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M40 20 Q42 18 44 20" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    ),
    dog: (
      <svg viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="30" fill="#F4A261" />
        <circle cx="24" cy="26" r="3" fill="#1A1A1A" />
        <circle cx="40" cy="26" r="3" fill="#1A1A1A" />
        <ellipse cx="32" cy="32" rx="4" ry="3" fill="#1A1A1A" />
        <path d="M28 38 Q32 42 36 38" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M20 22 Q22 20 24 22" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M40 22 Q42 20 44 22" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    ),
    rabbit: (
      <svg viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="30" fill="#FFE5E5" />
        <ellipse cx="28" cy="50" rx="8" ry="6" fill="#FFE5E5" />
        <path d="M20 14 Q24 10 28 14 Q32 10 36 14 Q40 10 44 14" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="26" cy="24" r="2.5" fill="#1A1A1A" />
        <circle cx="38" cy="24" r="2.5" fill="#1A1A1A" />
        <ellipse cx="32" cy="30" rx="2" ry="3" fill="#1A1A1A" />
        <path d="M28 34 Q32 38 36 34" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    ),
    panda: (
      <svg viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="30" fill="#FFFFFF" />
        <ellipse cx="32" cy="28" rx="12" ry="14" fill="#1A1A1A" />
        <circle cx="26" cy="24" r="4" fill="#FFFFFF" />
        <circle cx="38" cy="24" r="4" fill="#FFFFFF" />
        <circle cx="26" cy="24" r="2" fill="#1A1A1A" />
        <circle cx="38" cy="24" r="2" fill="#1A1A1A" />
        <ellipse cx="32" cy="32" rx="3" ry="4" fill="#FFFFFF" />
        <ellipse cx="32" cy="38" rx="5" ry="4" fill="#1A1A1A" />
      </svg>
    ),
    bear: (
      <svg viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="30" fill="#8B4513" />
        <ellipse cx="32" cy="28" rx="14" ry="16" fill="#654321" />
        <ellipse cx="20" cy="20" rx="5" ry="6" fill="#654321" />
        <ellipse cx="44" cy="20" rx="5" ry="6" fill="#654321" />
        <circle cx="22" cy="22" r="2.5" fill="#FFFFFF" />
        <circle cx="42" cy="22" r="2.5" fill="#FFFFFF" />
        <ellipse cx="32" cy="30" rx="3" ry="4" fill="#1A1A1A" />
        <ellipse cx="32" cy="38" rx="6" ry="5" fill="#654321" />
      </svg>
    ),
    fox: (
      <svg viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="30" fill="#FF6B35" />
        <polygon points="32,16 24,28 28,28" fill="#FFFFFF" />
        <polygon points="32,16 40,28 36,28" fill="#FFFFFF" />
        <circle cx="28" cy="26" r="2.5" fill="#1A1A1A" />
        <circle cx="36" cy="26" r="2.5" fill="#1A1A1A" />
        <polygon points="30,32 32,36 34,32" fill="#FFFFFF" />
        <ellipse cx="32" cy="38" rx="4" ry="3" fill="#1A1A1A" />
      </svg>
    ),
    owl: (
      <svg viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="30" fill="#8B6F47" />
        <ellipse cx="32" cy="28" rx="16" ry="18" fill="#6B4E37" />
        <circle cx="26" cy="24" r="5" fill="#FFFFFF" />
        <circle cx="38" cy="24" r="5" fill="#FFFFFF" />
        <circle cx="26" cy="24" r="3" fill="#1A1A1A" />
        <circle cx="38" cy="24" r="3" fill="#1A1A1A" />
        <polygon points="32,32 30,36 34,36" fill="#FFA500" />
        <path d="M24 38 Q32 42 40 38" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    ),
    tiger: (
      <svg viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="30" fill="#FF8C42" />
        <path d="M20 24 Q24 20 28 24 Q30 22 32 24 Q34 22 36 24 Q40 20 44 24" stroke="#1A1A1A" strokeWidth="2" fill="none" />
        <circle cx="26" cy="26" r="3" fill="#1A1A1A" />
        <circle cx="38" cy="26" r="3" fill="#1A1A1A" />
        <ellipse cx="32" cy="32" rx="3" ry="4" fill="#1A1A1A" />
        <path d="M28 38 Q32 42 36 38" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M22 28 L26 32 M42 28 L38 32" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    lion: (
      <svg viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="30" fill="#FFA500" />
        <circle cx="32" cy="24" r="16" fill="#FFD700" />
        <path d="M24 20 Q20 16 16 20 Q20 24 24 20" stroke="#1A1A1A" strokeWidth="1.5" fill="#FFD700" />
        <path d="M40 20 Q44 16 48 20 Q44 24 40 20" stroke="#1A1A1A" strokeWidth="1.5" fill="#FFD700" />
        <circle cx="28" cy="26" r="3" fill="#1A1A1A" />
        <circle cx="36" cy="26" r="3" fill="#1A1A1A" />
        <ellipse cx="32" cy="32" rx="3" ry="4" fill="#1A1A1A" />
        <path d="M28 38 Q32 42 36 38" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
    elephant: (
      <svg viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="30" fill="#A0A0A0" />
        <ellipse cx="32" cy="28" rx="14" ry="16" fill="#808080" />
        <path d="M38 18 Q42 14 46 18 Q44 22 40 22" stroke="#1A1A1A" strokeWidth="2.5" fill="#808080" strokeLinecap="round" />
        <circle cx="28" cy="26" r="2.5" fill="#1A1A1A" />
        <circle cx="36" cy="26" r="2.5" fill="#1A1A1A" />
        <path d="M30 32 Q32 36 34 32" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="32" cy="38" rx="5" ry="4" fill="#808080" />
      </svg>
    ),
    monkey: (
      <svg viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="30" fill="#DEB887" />
        <ellipse cx="32" cy="26" rx="12" ry="14" fill="#CD853F" />
        <circle cx="28" cy="24" r="3" fill="#1A1A1A" />
        <circle cx="36" cy="24" r="3" fill="#1A1A1A" />
        <ellipse cx="32" cy="30" rx="3" ry="4" fill="#1A1A1A" />
        <path d="M26 34 Q28 36 30 34 M34 34 Q36 36 38 34" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="32" cy="38" rx="6" ry="5" fill="#CD853F" />
      </svg>
    ),
    penguin: (
      <svg viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="30" fill="#FFFFFF" />
        <ellipse cx="32" cy="28" rx="12" ry="16" fill="#1A1A1A" />
        <ellipse cx="32" cy="24" rx="10" ry="12" fill="#FFFFFF" />
        <circle cx="28" cy="24" r="2.5" fill="#1A1A1A" />
        <circle cx="36" cy="24" r="2.5" fill="#1A1A1A" />
        <polygon points="30,28 32,32 34,28" fill="#FFA500" />
        <ellipse cx="32" cy="38" rx="5" ry="6" fill="#FFFFFF" />
      </svg>
    ),
    unicorn: (
      <svg viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="30" fill="#FFB6C1" />
        <circle cx="32" cy="28" r="12" fill="#FFDDF4" />
        <path d="M32 16 L36 8 L40 12 L38 16" fill="#FF69B4" stroke="#1A1A1A" strokeWidth="1.5" />
        <circle cx="28" cy="26" r="2.5" fill="#1A1A1A" />
        <circle cx="36" cy="26" r="2.5" fill="#1A1A1A" />
        <ellipse cx="32" cy="30" rx="2" ry="3" fill="#1A1A1A" />
        <path d="M28 34 Q32 38 36 34" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M34 18 L36 14 L38 16" stroke="#FF69B4" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    ),
    robot: (
      <svg viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="30" fill="#C0C0C0" />
        <rect x="22" y="20" width="20" height="24" rx="2" fill="#808080" />
        <rect x="26" y="16" width="12" height="6" rx="1" fill="#808080" />
        <circle cx="28" cy="28" r="3" fill="#00FF00" />
        <circle cx="36" cy="28" r="3" fill="#00FF00" />
        <rect x="28" y="34" width="8" height="2" rx="1" fill="#1A1A1A" />
        <rect x="30" y="38" width="4" height="4" rx="1" fill="#1A1A1A" />
        <rect x="26" y="42" width="3" height="4" rx="1" fill="#808080" />
        <rect x="35" y="42" width="3" height="4" rx="1" fill="#808080" />
      </svg>
    ),
    alien: (
      <svg viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="30" fill="#90EE90" />
        <ellipse cx="32" cy="26" rx="14" ry="18" fill="#7CFC00" />
        <ellipse cx="26" cy="22" rx="5" ry="8" fill="#000000" />
        <ellipse cx="38" cy="22" rx="5" ry="8" fill="#000000" />
        <ellipse cx="32" cy="32" rx="4" ry="3" fill="#000000" />
        <rect x="28" y="38" width="8" height="2" rx="1" fill="#000000" />
        <path d="M24 46 Q32 50 40 46" stroke="#000000" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="32" cy="16" r="4" fill="#FFD700" />
      </svg>
    ),
  }

  return (
    <div style={{ width: size, height: size }}>
      {icons[preset]}
    </div>
  )
}

