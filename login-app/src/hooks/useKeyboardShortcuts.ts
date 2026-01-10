import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  callback: (e: KeyboardEvent) => void
  description?: string
}

/**
 * Hook to register keyboard shortcuts
 * 
 * @example
 * useKeyboardShortcuts([
 *   { key: 's', ctrl: true, callback: handleSave, description: 'Save' },
 *   { key: 'Escape', callback: handleCancel, description: 'Cancel' }
 * ])
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(e: KeyboardEvent) {
      for (const shortcut of shortcuts) {
        const {
          key,
          ctrl = false,
          shift = false,
          alt = false,
          meta = false,
          callback,
        } = shortcut

        // Check if key matches
        const keyMatches = e.key.toLowerCase() === key.toLowerCase()
        
        // Check modifiers
        const ctrlMatches = ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey
        const shiftMatches = shift ? e.shiftKey : !e.shiftKey
        const altMatches = alt ? e.altKey : !e.altKey
        // meta is optional - it's checked as part of ctrlMatches above
        const _metaMatches = meta ? e.metaKey : true
        void _metaMatches // suppress unused warning

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          // Don't prevent default for all shortcuts, only specific ones
          if (ctrl || meta || alt) {
            e.preventDefault()
          }
          callback(e)
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts, enabled])
}

/**
 * Hook for common save shortcut (Ctrl/Cmd + S)
 */
export function useSaveShortcut(
  onSave: () => void,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options

  useKeyboardShortcuts(
    [
      {
        key: 's',
        ctrl: true,
        callback: (e) => {
          e.preventDefault()
          onSave()
        },
        description: 'Save',
      },
    ],
    { enabled }
  )
}

/**
 * Hook for escape key handling
 */
export function useEscapeKey(
  onEscape: () => void,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options

  useKeyboardShortcuts(
    [
      {
        key: 'Escape',
        callback: onEscape,
        description: 'Close/Cancel',
      },
    ],
    { enabled }
  )
}

/**
 * Hook for enter key handling (for forms/confirmations)
 */
export function useEnterKey(
  onEnter: () => void,
  options: { enabled?: boolean; preventInTextarea?: boolean } = {}
) {
  const { enabled = true, preventInTextarea = true } = options

  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Enter') return

      // Don't trigger in textarea unless Ctrl/Cmd is pressed
      if (preventInTextarea) {
        const target = e.target as HTMLElement
        if (target.tagName === 'TEXTAREA' && !e.ctrlKey && !e.metaKey) {
          return
        }
      }

      onEnter()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onEnter, enabled, preventInTextarea])
}
