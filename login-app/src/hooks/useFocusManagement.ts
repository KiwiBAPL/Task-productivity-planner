import { useEffect, useRef, useCallback } from 'react'
// #region agent log
fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useFocusManagement.ts:1',message:'useFocusManagement loading',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
// #endregion

interface UseFocusTrapOptions {
  /**
   * Whether the focus trap is active
   */
  enabled: boolean
  /**
   * Element to focus when trap becomes active
   */
  initialFocus?: HTMLElement | null
  /**
   * Element to return focus to when trap is disabled
   */
  returnFocus?: HTMLElement | null
}

/**
 * Hook to trap focus within a container (useful for modals)
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, options: UseFocusTrapOptions) {
  const { enabled, initialFocus, returnFocus } = options
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    // Store current focus
    previousFocusRef.current = document.activeElement as HTMLElement

    // Focus initial element or first focusable element
    if (initialFocus) {
      initialFocus.focus()
    } else {
      const focusableElements = getFocusableElements(containerRef.current)
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (!enabled || !containerRef.current) return
      
      if (e.key !== 'Tab') return

      const focusableElements = getFocusableElements(containerRef.current!)
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      // Shift + Tab on first element -> focus last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
      // Tab on last element -> focus first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      
      // Return focus to previous element or specified element
      const elementToFocus = returnFocus || previousFocusRef.current
      if (elementToFocus) {
        elementToFocus.focus()
      }
    }
  }, [enabled, containerRef, initialFocus, returnFocus])
}

/**
 * Hook to manage auto-focus on mount
 */
export function useAutoFocus(
  elementRef: React.RefObject<HTMLElement>,
  options: { enabled?: boolean; delay?: number } = {}
) {
  const { enabled = true, delay = 0 } = options

  useEffect(() => {
    if (!enabled || !elementRef.current) return

    const timeoutId = setTimeout(() => {
      elementRef.current?.focus()
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [enabled, elementRef, delay])
}

/**
 * Hook to return focus to an element when component unmounts
 */
export function useFocusReturn(elementToReturn?: HTMLElement | null) {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Store current focus on mount
    previousFocusRef.current = document.activeElement as HTMLElement

    return () => {
      // Return focus on unmount
      const element = elementToReturn || previousFocusRef.current
      if (element && typeof element.focus === 'function') {
        element.focus()
      }
    }
  }, [elementToReturn])
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')

  return Array.from(container.querySelectorAll(selector)) as HTMLElement[]
}

/**
 * Hook for managing focus on list navigation (arrow keys)
 */
export function useListFocus(
  listRef: React.RefObject<HTMLElement>,
  options: { enabled?: boolean; wrap?: boolean } = {}
) {
  const { enabled = true, wrap = true } = options

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled || !listRef.current) return

      const focusableElements = getFocusableElements(listRef.current)
      if (focusableElements.length === 0) return

      const currentIndex = focusableElements.findIndex((el) => el === document.activeElement)

      let nextIndex: number | null = null

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault()
          nextIndex = currentIndex + 1
          if (nextIndex >= focusableElements.length) {
            nextIndex = wrap ? 0 : null
          }
          break
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault()
          nextIndex = currentIndex - 1
          if (nextIndex < 0) {
            nextIndex = wrap ? focusableElements.length - 1 : null
          }
          break
        case 'Home':
          e.preventDefault()
          nextIndex = 0
          break
        case 'End':
          e.preventDefault()
          nextIndex = focusableElements.length - 1
          break
      }

      if (nextIndex !== null && focusableElements[nextIndex]) {
        focusableElements[nextIndex].focus()
      }
    },
    [enabled, listRef, wrap]
  )

  return { handleKeyDown }
}
